"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IllustrationProfile,
  IllustrationQuality,
  IllustrationAspectRatio,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";
import ConceptPromptBar from "@/components/illustrations/ConceptPromptBar";
import SampleGallery from "@/components/illustrations/SampleGallery";

const GenerationResultPanel = dynamic(
  () => import("@/components/illustrations/GenerationResultPanel"),
  { ssr: false },
);
const AdvancedSettingsPanel = dynamic(
  () => import("@/components/illustrations/AdvancedSettingsPanel"),
  { ssr: false },
);
const StyleGuideModal = dynamic(
  () => import("@/components/illustrations/StyleGuideModal"),
  { ssr: false },
);
const DailyLimitModal = dynamic(
  () => import("@/components/illustrations/DailyLimitModal"),
  { ssr: false },
);

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
          <h1 className="text-xl font-black text-gray-900">교안 일러스트 스타일 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            스타일을 설정하면 교안 생성 시 일관된 화풍으로 일러스트가 적용됩니다
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
      {showGuide && <StyleGuideModal onClose={() => setShowGuide(false)} />}
      {/* Daily Limit Modal */}
      {showLimitModal && (
        <DailyLimitModal dailyUsage={dailyUsage} onClose={() => setShowLimitModal(false)} />
      )}
    </main>
  );
}
