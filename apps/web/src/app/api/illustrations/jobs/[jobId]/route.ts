import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getIllustrationCredits,
  getIllustrationJob,
  IllustrationJobNotFoundError,
} from "@/lib/illustrations";

export async function GET(
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
    const [job, credits] = await Promise.all([
      getIllustrationJob(email, jobId),
      getIllustrationCredits(email),
    ]);
    return NextResponse.json({ job, credits });
  } catch (error) {
    if (error instanceof IllustrationJobNotFoundError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_JOB_GET_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
