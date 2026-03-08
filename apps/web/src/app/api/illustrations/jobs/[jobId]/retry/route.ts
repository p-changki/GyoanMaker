import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getIllustrationCredits,
  IllustrationCreditError,
  IllustrationJobNotFoundError,
  retryIllustrationJob,
} from "@/lib/illustrations";

export async function POST(
  _req: NextRequest,
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

  try {
    const job = await retryIllustrationJob(email, jobId);
    const credits = await getIllustrationCredits(email);
    return NextResponse.json({ job, credits });
  } catch (error) {
    if (error instanceof IllustrationJobNotFoundError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }

    if (error instanceof IllustrationCreditError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: "Insufficient illustration credits for retry.",
            needed: error.needed,
            available: error.available,
          },
        },
        { status: 402 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_JOB_RETRY_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
