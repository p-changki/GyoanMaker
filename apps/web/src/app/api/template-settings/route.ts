import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTemplateSettings, updateTemplateSettings } from "@/lib/templateSettings";
import { VALID_PAGE2_SECTIONS, VALID_THEME_PRESETS, VALID_FONT_SCALES, VALID_FONT_FAMILIES, VALID_TITLE_WEIGHTS, FONT_SIZE_SLOT_META, isCustomSectionKey } from "@gyoanmaker/shared/types";
import type { BuiltInSectionKey, ThemePreset, FontScale, FontFamily, TitleWeight, FontSizeConfig } from "@gyoanmaker/shared/types";

const MAX_LOGO_BASE64_LENGTH = 680_000;
const MAX_AVATAR_BASE64_LENGTH = 680_000;
const MAX_ACADEMY_NAME_LENGTH = 20;
const MAX_DEFAULT_TEXT_LENGTH = 50;

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  try {
    const settings = await getTemplateSettings(email);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/template-settings] GET failed: ${message}`);
    return NextResponse.json(
      { error: { code: "TEMPLATE_SETTINGS_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    if (
      body.academyName !== undefined &&
      body.academyName !== null &&
      (typeof body.academyName !== "string" ||
        body.academyName.length > MAX_ACADEMY_NAME_LENGTH)
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `학원명은 ${MAX_ACADEMY_NAME_LENGTH}자 이하여야 합니다.` } },
        { status: 400 }
      );
    }

    if (
      body.logoBase64 !== undefined &&
      body.logoBase64 !== null &&
      (typeof body.logoBase64 !== "string" ||
        !body.logoBase64.startsWith("data:image/") ||
        body.logoBase64.length > MAX_LOGO_BASE64_LENGTH)
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "로고 이미지가 유효하지 않거나 200KB를 초과합니다." } },
        { status: 400 }
      );
    }

    if (
      body.avatarBase64 !== undefined &&
      body.avatarBase64 !== null &&
      (typeof body.avatarBase64 !== "string" ||
        !body.avatarBase64.startsWith("data:image/") ||
        body.avatarBase64.length > MAX_AVATAR_BASE64_LENGTH)
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "캐릭터 이미지가 유효하지 않거나 200KB를 초과합니다." } },
        { status: 400 }
      );
    }

    if (
      body.themePreset !== undefined &&
      (typeof body.themePreset !== "string" ||
        !VALID_THEME_PRESETS.has(body.themePreset as ThemePreset))
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "유효하지 않은 테마입니다." } },
        { status: 400 }
      );
    }

    if (
      body.fontScale !== undefined &&
      (typeof body.fontScale !== "string" ||
        !VALID_FONT_SCALES.has(body.fontScale as FontScale))
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "유효하지 않은 폰트 크기입니다." } },
        { status: 400 }
      );
    }

    if (
      body.fontFamily !== undefined &&
      (typeof body.fontFamily !== "string" ||
        !VALID_FONT_FAMILIES.has(body.fontFamily as FontFamily))
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "유효하지 않은 폰트입니다." } },
        { status: 400 }
      );
    }

    if (
      body.titleWeight !== undefined &&
      (typeof body.titleWeight !== "string" ||
        !VALID_TITLE_WEIGHTS.has(body.titleWeight as TitleWeight))
    ) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "유효하지 않은 굵기입니다." } },
        { status: 400 }
      );
    }

    for (const field of ["defaultHeaderText", "defaultAnalysisTitle", "defaultSummaryTitle"] as const) {
      if (body[field] !== undefined && body[field] !== null) {
        if (typeof body[field] !== "string" || body[field].length > MAX_DEFAULT_TEXT_LENGTH) {
          return NextResponse.json(
            { error: { code: "VALIDATION_ERROR", message: `기본 제목은 ${MAX_DEFAULT_TEXT_LENGTH}자 이하여야 합니다.` } },
            { status: 400 }
          );
        }
        if (!(body[field] as string).trim()) {
          body[field] = null;
        }
      }
    }

    if (body.fontSizes !== undefined) {
      if (typeof body.fontSizes !== "object" || body.fontSizes === null) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "fontSizes가 유효하지 않습니다." } },
          { status: 400 }
        );
      }
      const SLOTS = Object.keys(FONT_SIZE_SLOT_META) as (keyof FontSizeConfig)[];
      for (const key of SLOTS) {
        const meta = FONT_SIZE_SLOT_META[key];
        const val = body.fontSizes[key];
        if (typeof val !== "number" || !Number.isFinite(val) || val < meta.min || val > meta.max) {
          return NextResponse.json(
            { error: { code: "VALIDATION_ERROR", message: `${meta.label} 크기가 유효하지 않습니다.` } },
            { status: 400 }
          );
        }
      }
    }

    if (body.page2Sections !== undefined) {
      if (
        !Array.isArray(body.page2Sections) ||
        body.page2Sections.length === 0 ||
        !body.page2Sections.every(
          (k: unknown) =>
            typeof k === "string" && (VALID_PAGE2_SECTIONS.has(k as BuiltInSectionKey) || isCustomSectionKey(k))
        )
      ) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "섹션 설정이 유효하지 않습니다." } },
          { status: 400 }
        );
      }
      const unique = [...new Set(body.page2Sections)];
      body.page2Sections = unique;
    }

    const updated = await updateTemplateSettings(email, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/template-settings] PATCH failed: ${message}`);
    return NextResponse.json(
      { error: { code: "TEMPLATE_SETTINGS_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
