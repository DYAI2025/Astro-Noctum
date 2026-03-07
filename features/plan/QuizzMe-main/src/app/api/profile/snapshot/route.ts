/**
 * GET /api/profile/snapshot
 *
 * Returns the current ProfileSnapshot for the authenticated user.
 *
 * Query params: (none, inferred from session)
 *
 * Response:
 * {
 *   snapshot: ProfileSnapshot,
 *   isNew: boolean
 * }
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "@/lib/api/contribute-service";
import { createClient } from "@/lib/supabase/server";
import { SupabaseProfileStore } from "@/lib/storage/supabase-store";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
  
    // 2. Get Snapshot for Authenticated User
    const result = await getSnapshot(new SupabaseProfileStore(supabase), user.id);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/profile/snapshot] Error:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
