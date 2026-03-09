import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCosmicEngine } from "@/server/cosmicEngine/engine";

export type ComputeRequestBody = {
  force?: boolean;
};

type AstroProfileRow = {
  user_id: string;
  username: string;
  birth_date: string; // YYYY-MM-DD
  birth_time: string; // HH:MM:SS
  birth_time_local: string; // HH:MM:SS
  iana_time_zone: string;
  fold: number | null;
  birth_place_name: string;
  birth_place_country: string | null;
  birth_lat: number;
  birth_lng: number;

  astro_json: any;
  astro_meta_json: any;
  astro_validation_json: any;
  astro_compute_hash: string | null;
  astro_computed_at: string | null;
  astro_validation_status: string | null;
  input_status: "ready" | "computing" | "computed" | "error";
};

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((x) => Number(x));
  if (!y || !m || !d) throw new Error(`Invalid birth_date: ${dateStr}`);
  return { year: y, month: m, day: d };
}

function parseTimeParts(timeStr: string) {
  const parts = timeStr.split(":").map((x) => Number(x));
  const hour = parts[0];
  const minute = parts[1];
  const second = parts.length >= 3 ? parts[2] : 0;

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    Number.isNaN(second)
  ) {
    throw new Error(`Invalid birth_time: ${timeStr}`);
  }
  return { hour, minute, second };
}

function sha256(input: object): string {
  const s = JSON.stringify(input);
  return crypto.createHash("sha256").update(s).digest("hex");
}

function pickWesternAnchors(result: any) {
  const western = result?.western;
  return {
    sun_sign: western?.sun?.sign ?? null,
    moon_sign: western?.moon?.sign ?? null,
    asc_sign: western?.ascendant?.sign ?? null,
  };
}

function pickValidationStatus(result: any): string | null {
  const status = result?.validation?.status;
  return typeof status === "string" ? status : null;
}

function isPrecisionLikeError(err: unknown): err is { code?: string; details?: any; message?: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

async function markStatus(userId: string, status: AstroProfileRow["input_status"], extra: Partial<AstroProfileRow> = {}) {
  const supabase = await createClient();
  return supabase
    .from("astro_profiles")
    .update({ input_status: status, ...extra })
    .eq("user_id", userId);
}

export async function handleAstroCompute(req: Request, label = "astro-compute") {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: ComputeRequestBody = {};
    try {
      body = (await req.json()) as ComputeRequestBody;
    } catch {
      body = {};
    }

    const force = body.force === true;

    const { data: row, error: rowErr } = await supabase
      .from("astro_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single<AstroProfileRow>();

    if (rowErr || !row) {
      return NextResponse.json(
        { ok: false, error: "Astro profile not found. Complete onboarding first." },
        { status: 404 }
      );
    }

    const missing: string[] = [];
    if (!row.birth_date) missing.push("birth_date");
    const birthTime = row.birth_time_local || row.birth_time;
    if (!birthTime) missing.push("birth_time_local");
    if (!row.iana_time_zone) missing.push("iana_time_zone");
    if (typeof row.birth_lat !== "number") missing.push("birth_lat");
    if (typeof row.birth_lng !== "number") missing.push("birth_lng");

    if (missing.length > 0) {
      await markStatus(user.id, "error", {
        astro_validation_status: "missing_fields",
        astro_validation_json: { missing },
      });

      return NextResponse.json(
        { ok: false, error: "Missing required fields", missing },
        { status: 422 }
      );
    }

    const computeInputForHash = {
      birth_date: row.birth_date,
      birth_time: birthTime,
      iana_time_zone: row.iana_time_zone,
      fold: row.fold ?? null,
      birth_lat: row.birth_lat,
      birth_lng: row.birth_lng,
      strict: process.env.COSMIC_STRICT_MODE ?? "1",
      allow_moshier: process.env.ASTRO_PRECISION_ALLOW_MOSHIER ?? "0",
    };

    const computeHash = sha256(computeInputForHash);

    if (!force && row.astro_compute_hash === computeHash && row.astro_computed_at) {
      await markStatus(user.id, "computed");
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "unchanged",
        astro_compute_hash: row.astro_compute_hash,
        astro_computed_at: row.astro_computed_at,
        astro_validation_status: row.astro_validation_status,
        input_status: "computed",
      });
    }

    await markStatus(user.id, "computing", {
      astro_validation_status: null,
      astro_validation_json: {},
    });

    const { year, month, day } = parseDateParts(row.birth_date);
    const { hour, minute, second } = parseTimeParts(birthTime);

    const engine = await getCosmicEngine();

    const engineInput = {
      year,
      month,
      day,
      hour,
      minute,
      second,
      latitude: row.birth_lat,
      longitude: row.birth_lng,
      timezone: row.iana_time_zone,
      houseSystem: "P" as const, // Placidus (default)
      ...(row.fold === 0 || row.fold === 1 ? { fold: row.fold } : {}),
    };

    console.log(`[POST /api/${label}] Input for engine:`, engineInput);

    let result: any;
    try {
      result = await engine.calculateProfile(engineInput);
      console.log(`[POST /api/${label}] Engine Result Keys:`, Object.keys(result || {}));
    } catch (err) {
      if (isPrecisionLikeError(err)) {
        const code = (err as any).code ?? "PRECISION_ERROR";
        const details = (err as any).details ?? {};
        const message = (err as any).message ?? "Precision error";

        await markStatus(user.id, "error", {
          astro_validation_status: code,
          astro_validation_json: details,
        });

        const httpStatus =
          typeof details.httpStatus === "number" ? details.httpStatus :
          code === "AMBIGUOUS_LOCAL_TIME" ? 409 :
          code === "NONEXISTENT_LOCAL_TIME" ? 422 :
          422;

        return NextResponse.json(
          {
            ok: false,
            error: message,
            code,
            details,
          },
          { status: httpStatus }
        );
      }

      console.error(`[POST /api/${label}] Unknown error:`, err);
      await markStatus(user.id, "error", {
        astro_validation_status: "error",
      });
      return NextResponse.json(
        { ok: false, error: "Compute failed" },
        { status: 500 }
      );
    }

    const anchors = pickWesternAnchors(result);
    const validationStatus = pickValidationStatus(result);

    const updatePayload = {
      astro_json: result,
      astro_meta_json: result?.meta ?? null,
      astro_validation_json: result?.validation ?? null,
      astro_compute_hash: computeHash,
      astro_computed_at: new Date().toISOString(),
      astro_validation_status: validationStatus,
      sun_sign: anchors.sun_sign,
      moon_sign: anchors.moon_sign,
      asc_sign: anchors.asc_sign,
      input_status: "computed" as const,
    };

    const { error: upErr } = await supabase
      .from("astro_profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    if (upErr) {
      console.error(`[POST /api/${label}] DB update error:`, upErr);
      await markStatus(user.id, "error", {
        astro_validation_status: (upErr as any).code ?? "DB_UPDATE_ERROR",
      });
      return NextResponse.json(
        { ok: false, error: "Failed to persist computed profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      skipped: false,
      astro_compute_hash: computeHash,
      astro_computed_at: updatePayload.astro_computed_at,
      astro_validation_status: validationStatus,
      anchors,
      meta: result?.meta ?? null,
      validation: result?.validation ?? null,
      input_status: updatePayload.input_status,
    });
  } catch (err) {
    console.error(`[POST /api/${label}] Fatal error:`, err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
