"use client";

import type { FontFamily } from "@gyoanmaker/shared/types";

const FONT_STYLESHEET_URLS: Partial<Record<FontFamily, string>> = {
  pretendard: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
  noto: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap",
  nanumSquare: "https://hangeul.pstatic.net/hangeul_static/css/nanum-square.css",
  nanumGothic: "https://hangeul.pstatic.net/hangeul_static/css/nanum-gothic.css",
  spoqa: "https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css",
  suit: "https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.css",
};

const loadedStylesheets = new Set<string>();

function ensureStylesheet(url: string): void {
  if (typeof document === "undefined") return;
  if (loadedStylesheets.has(url)) return;

  const existing = document.querySelector<HTMLLinkElement>(
    `link[rel="stylesheet"][href="${url}"]`
  );
  if (existing) {
    loadedStylesheets.add(url);
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-font-loader", "template");
  link.onload = () => loadedStylesheets.add(url);
  link.onerror = () => {
    console.warn(`[font-loader] failed to load stylesheet: ${url}`);
  };
  document.head.appendChild(link);
  loadedStylesheets.add(url);
}

export function ensureFontFamilyLoaded(fontFamily: FontFamily): void {
  const stylesheetUrl = FONT_STYLESHEET_URLS[fontFamily];
  if (!stylesheetUrl) return;
  ensureStylesheet(stylesheetUrl);
}

