/**
 * POST /api/contribute
 *
 * Accepts a ContributionEvent and processes it through the ingestion pipeline.
 *
 * Request body:
 * {
 *   event: ContributionEvent
 * }
 *
 * Response:
 * {
 *   accepted: boolean,
 *   snapshot: ProfileSnapshot,
 *   error?: string
 * }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { contribute } from "@/lib/api/contribute-service";
import { createClient } from "@/lib/supabase/server";
import { SupabaseProfileStore } from "@/lib/storage/supabase-store";
import { getDefaultEventStore } from "@/lib/storage/json-store";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: "Unauthorized", accepted: false },
            { status: 401 }
        );
    }
    
    // 2. Parse Body
    const body = await req.json();
    const event = body.event;

    if (!event) {
      return NextResponse.json(
        { error: "Missing 'event' in request body", accepted: false },
        { status: 400 }
      );
    }

    // 3. Process contribution using authenticated User ID
    const result = await contribute(
      {
        profiles: new SupabaseProfileStore(supabase),
        // We stick with JSONL for event audit log for now (cheap append-only)
        // ideally this moves to Supabase too, but it's less critical for consistency.
        events: getDefaultEventStore(),
      },
      { userId: user.id, event }
    );

    // Return appropriate status based on acceptance
    const status = result.accepted ? 200 : 422;

    return NextResponse.json(result, { status });
  } catch (err) {
    console.error("[POST /api/contribute] Error:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
        accepted: false,
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/contribute",
    method: "POST",
    description: "Submit a ContributionEvent for processing. Requires Auth.",
  });
}