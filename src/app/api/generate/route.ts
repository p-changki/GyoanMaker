import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel API Proxy
 *
 * 브라우저에서 Cloud Run URL과 API Key가 노출되는 것을 방지하기 위해
 * Next.js 서버 사이드에서 요청을 대신 전달한다.
 */
export async function POST(req: NextRequest) {
  const baseUrl = process.env.CLOUDRUN_API_BASE_URL;
  const apiKey = process.env.CLOUDRUN_API_KEY;

  if (!baseUrl || !apiKey) {
    console.error(
      "[api/generate] Server is misconfigured: Missing baseUrl or apiKey."
    );
    return NextResponse.json(
      {
        error: {
          code: "SERVER_MISCONFIGURED",
          message: "Server is not properly configured.",
        },
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    // Cloud Run 백엔드로 요청 전달
    const response = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(body),
      // Vercel 서버리스 환경에서 타임아웃 방지 (Gemini는 응답에 시간이 걸릴 수 있음)
      signal: AbortSignal.timeout(55000), // Vercel Hobby 기준 60초 미만
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/generate] Proxy error:", error);
    return NextResponse.json(
      {
        error: {
          code: "PROXY_ERROR",
          message: "Failed to connect to backend server.",
        },
      },
      { status: 502 }
    );
  }
}
