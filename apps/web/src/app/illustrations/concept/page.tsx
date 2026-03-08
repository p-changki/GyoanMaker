"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IllustrationProfile,
  IllustrationQuality,
  IllustrationAspectRatio,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";
import ConceptPromptBar from "@/components/illustrations/ConceptPromptBar";
import GenerationResultPanel from "@/components/illustrations/GenerationResultPanel";
import SampleGallery from "@/components/illustrations/SampleGallery";
import AdvancedSettingsPanel from "@/components/illustrations/AdvancedSettingsPanel";

interface ProfileResponse {
  profile: IllustrationProfile;
  credits: number;
}

interface PendingResult {
  imageUrl: string;
  storagePath: string;
  prompt: string;
  model: string;
  scene: string;
  quality: string;
  aspectRatio: string;
}

async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetch("/api/illustrations/profile");
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json() as Promise<ProfileResponse>;
}

export default function IllustrationConceptPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [promptText, setPromptText] = useState("");
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingReferenceImage, setIsUploadingReferenceImage] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [dailyUsage, setDailyUsage] = useState<{ used: number; limit: number } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["illustration-profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });

  const credits = profileData?.credits ?? 0;
  const profile = profileData?.profile;

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") resolve(result);
        else reject(new Error("파일을 읽지 못했습니다."));
      };
      reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
      reader.readAsDataURL(file);
    });
  }

  async function patchReferenceImage(payload: {
    referenceImage?: IllustrationReferenceImage | null;
    referenceImageDataUrl?: string;
  }) {
    const res = await fetch("/api/illustrations/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message || "참조 이미지 저장에 실패했습니다.");
    }
    await queryClient.invalidateQueries({ queryKey: ["illustration-profile"] });
  }

  async function handleReferenceImageSelect(file: File) {
    setIsUploadingReferenceImage(true);
    setMessage(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      await patchReferenceImage({ referenceImageDataUrl: dataUrl });
      setMessage({ text: "참조 이미지가 저장되었습니다.", type: "success" });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "참조 이미지 저장에 실패했습니다.";
      setMessage({ text, type: "error" });
    } finally {
      setIsUploadingReferenceImage(false);
    }
  }

  async function handleClearReferenceImage() {
    setIsUploadingReferenceImage(true);
    setMessage(null);
    try {
      await patchReferenceImage({ referenceImage: null });
      setMessage({ text: "참조 이미지가 제거되었습니다.", type: "success" });
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "참조 이미지 제거에 실패했습니다.";
      setMessage({ text, type: "error" });
    } finally {
      setIsUploadingReferenceImage(false);
    }
  }

  async function handleGenerate() {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    setMessage(null);
    setPendingResult(null);

    try {
      const quality: IllustrationQuality = profile?.defaultQuality ?? "standard";
      const aspectRatio: IllustrationAspectRatio = profile?.aspectRatio ?? "4:3";

      const res = await fetch("/api/illustrations/profile/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: promptText,
          quality,
          aspectRatio,
          referenceImage: profile?.referenceImage,
        }),
      });

      const data = (await res.json()) as {
        sample?: {
          imageUrl: string;
          storagePath: string;
          prompt: string;
          model: string;
        };
        dailyUsage?: { used: number; limit: number };
        error?: { message?: string; code?: string; used?: number; limit?: number };
      };

      if (data.dailyUsage) {
        setDailyUsage(data.dailyUsage);
      }
      if (data.error?.used !== undefined && data.error?.limit !== undefined) {
        setDailyUsage({ used: data.error.used, limit: data.error.limit });
      }

      if (!res.ok) {
        if (res.status === 429) {
          setShowLimitModal(true);
          return;
        }
        throw new Error(data.error?.message || "스타일 테스트 생성에 실패했습니다.");
      }

      if (!data.sample?.imageUrl) {
        throw new Error("이미지를 받지 못했습니다.");
      }

      setPendingResult({
        imageUrl: data.sample.imageUrl,
        storagePath: data.sample.storagePath,
        prompt: data.sample.prompt,
        model: data.sample.model,
        scene: promptText,
        quality,
        aspectRatio,
      });

      setMessage({ text: "스타일 테스트 이미지가 생성되었습니다.", type: "success" });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage({ text, type: "error" });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!pendingResult) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/illustrations/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: pendingResult.scene,
          revisedPrompt: pendingResult.prompt,
          imageUrl: pendingResult.imageUrl,
          storagePath: pendingResult.storagePath,
          model: pendingResult.model,
          quality: pendingResult.quality,
          aspectRatio: pendingResult.aspectRatio,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(data.error?.message || "저장에 실패했습니다.");
      }

      setPendingResult(null);
      setPromptText("");
      setMessage({ text: "스타일 샘플이 갤러리에 저장되었습니다.", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["illustration-samples"] });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Unknown error";
      setMessage({ text, type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    setPendingResult(null);
    setMessage(null);
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">교안 삽화 스타일 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            스타일을 설정하면 교안 생성 시 일관된 화풍으로 삽화가 적용됩니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:border-[#5E35B1]/30 hover:text-[#5E35B1] transition-colors"
          >
            사용 가이드
          </button>
          <button
            type="button"
            onClick={() => router.push("/account?topup=illustration")}
            className="rounded-lg border border-[#5E35B1]/30 bg-[#5E35B1]/5 px-3 py-1.5 text-xs font-bold text-[#5E35B1]"
          >
            크레딧 충전
          </button>
        </div>
      </div>

      {/* 1. Test Prompt */}
      <ConceptPromptBar
        value={promptText}
        onChange={setPromptText}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        credits={credits}
        referenceImageUrl={profile?.referenceImage?.imageUrl}
        onReferenceImageSelect={handleReferenceImageSelect}
        onReferenceImageClear={handleClearReferenceImage}
        isUploadingReferenceImage={isUploadingReferenceImage}
        dailyUsage={dailyUsage}
      />

      {/* 2. Style Settings (Advanced) */}
      <AdvancedSettingsPanel
        profile={profile}
        isOpen={isAdvancedOpen}
        onToggle={() => setIsAdvancedOpen((prev) => !prev)}
      />

      {/* Status Message */}
      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Generation Result */}
      {pendingResult && (
        <GenerationResultPanel
          result={pendingResult}
          onSave={handleSave}
          onDiscard={handleDiscard}
          isSaving={isSaving}
        />
      )}

      {/* 3. Sample Gallery */}
      <SampleGallery />
      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">삽화 스타일 설정 가이드</h2>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              삽화 스타일을 설정하면 교안의 모든 삽화가 일관된 화풍으로 생성됩니다.
              아래 3가지 방법 중 원하는 방식으로 시작하세요.
            </p>

            {/* Flow 1 */}
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">1</span>
                <h3 className="text-sm font-black text-gray-800">간단 모드 — 프롬프트만 입력</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">가장 빠른 방법. 원하는 스타일을 텍스트로 설명하면 AI가 생성합니다.</p>
              <ol className="space-y-1.5 text-xs text-gray-700">
                <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 1</span>상단 입력창에 원하는 화풍을 설명합니다<br/><span className="text-gray-400">예: &quot;따뜻한 수채화풍, 동화 같은 분위기&quot;</span></li>
                <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 2</span>&lsquo;스타일 테스트 생성&rsquo; 버튼을 클릭합니다</li>
                <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 3</span>결과가 마음에 들면 &lsquo;저장&rsquo;하여 샘플 갤러리에 추가합니다</li>
                <li className="flex gap-2"><span className="font-bold text-emerald-600 shrink-0">Step 4</span>갤러리에서 원하는 샘플을 &lsquo;활성화&rsquo;하면 교안 삽화에 적용됩니다</li>
              </ol>
            </div>

            {/* Flow 2 */}
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">2</span>
                <h3 className="text-sm font-black text-gray-800">참조 이미지 모드 — 이미지 + 프롬프트</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">원하는 화풍의 이미지를 업로드하면 AI가 해당 스타일을 분석하여 반영합니다.</p>
              <ol className="space-y-1.5 text-xs text-gray-700">
                <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 1</span>입력창 좌측의 이미지 아이콘을 클릭하여 참조 이미지를 업로드합니다</li>
                <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 2</span>추가 설명을 입력합니다 (선택사항)</li>
                <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 3</span>&lsquo;스타일 테스트 생성&rsquo;을 클릭합니다</li>
                <li className="flex gap-2"><span className="font-bold text-blue-600 shrink-0">Step 4</span>결과를 저장하고 갤러리에서 활성화합니다</li>
              </ol>
            </div>

            {/* Flow 3 */}
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">3</span>
                <h3 className="text-sm font-black text-gray-800">고급 모드 — 세부 스타일 직접 조정</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">스타일명, 팔레트, 선 스타일, 분위기, 캐릭터 가이드를 직접 세팅합니다.</p>
              <ol className="space-y-1.5 text-xs text-gray-700">
                <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 1</span>&lsquo;스타일 고급 설정&rsquo; 패널을 열어 세부 항목을 조정합니다</li>
                <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 2</span>&lsquo;이미지에서 스타일 추출&rsquo;로 자동 채우기도 가능합니다</li>
                <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 3</span>설정 완료 후 &lsquo;설정 저장&rsquo;을 클릭합니다</li>
                <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 4</span>상단 입력창에서 프롬프트를 입력하고 스타일 테스트를 생성합니다</li>
                <li className="flex gap-2"><span className="font-bold text-amber-600 shrink-0">Step 5</span>결과를 저장하고 갤러리에서 활성화합니다</li>
              </ol>
            </div>

            {/* Tip */}
            <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-600 space-y-1.5">
              <p className="font-bold text-gray-700">TIP</p>
              <p>• 갤러리에서 &lsquo;활성화&rsquo;된 샘플이 교안 삽화 생성 시 컨셉으로 사용됩니다</p>
              <p>• 교안 편집(Compile) 페이지에서 컨셉 적용 강도를 &lsquo;참고/강제&rsquo;로 조절할 수 있습니다</p>
              <p>• 여러 스타일을 테스트한 뒤 가장 마음에 드는 것을 활성화하세요</p>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#5E35B1] py-3 text-sm font-black text-white hover:bg-[#4A2A8F] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
      {/* Daily Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-2">일일 테스트 한도 초과</h2>
            <p className="text-sm text-gray-500 mb-1">
              오늘의 스타일 테스트 생성 한도({dailyUsage?.limit ?? 10}회)를 모두 사용했습니다.
            </p>
            <p className="text-xs text-gray-400 mb-5">
              매일 자정(KST)에 초기화됩니다.
            </p>
            {dailyUsage && (
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>사용량</span>
                  <span className="font-bold">{dailyUsage.used} / {dailyUsage.limit}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowLimitModal(false)}
              className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
