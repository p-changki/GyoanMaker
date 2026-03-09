"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import PostDetailView from "@/components/board/PostDetail";

async function fetchPost(id: string) {
  const res = await fetch(`/api/board/${id}`);
  if (!res.ok) throw new Error("Failed to load post.");
  return res.json();
}

function checkIsAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["board-post", id],
    queryFn: () => fetchPost(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-3 border-gray-900 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center text-sm font-medium text-red-600">
        게시글을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <PostDetailView
      post={post}
      currentUserEmail={session?.user?.email ?? ""}
      isAdmin={checkIsAdmin(session?.user?.email)}
    />
  );
}
