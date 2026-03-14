import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getIllustrationCredits,
  IllustrationJobNotFoundError,
  runIllustrationJob,
} from "@/lib/illustrations";

interface RunBody {
  batchSize?: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { jobId } = await params;
  const body = (await req.json().catch(() => ({}))) as RunBody;
  const batchSize =
    typeof body.batchSize === "number" && Number.isFinite(body.batchSize)
      ? Math.max(1, Math.min(10, Math.floor(body.batchSize)))
      : 3;

  try {
    const job = await runIllustrationJob(email, jobId, batchSize);
    const credits = await getIllustrationCredits(email);
    return NextResponse.json({ job, credits });
  } catch (error) {
    if (error instanceof IllustrationJobNotFoundError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/illustrations/jobs/${jobId}/run] Failed: ${message}`);
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_JOB_RUN_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
