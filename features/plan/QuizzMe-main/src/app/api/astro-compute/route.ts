import { handleAstroCompute } from "@/server/astro/astroComputeHandler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleAstroCompute(req, "astro-compute");
}
