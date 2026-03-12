"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PostList from "@/components/board/PostList";
import type { PostMeta } from "@/lib/board/types";

type FilterTab = "all" | "mine";
type SortOrder = "newest" | "oldest";

const PAGE_SIZE = 20;

async function fetchPosts(): Promise<PostMeta[]> {
  const res = await fetch("/api/board");
  if (!res.ok) throw new Error("Failed to load posts.");
  const data = await res.json();
  return data.posts ?? [];
}

export default function BoardPage() {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email ?? "";

  const [filter, setFilter] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: posts, isLoading, isError } = useQuery({
    queryKey: ["board-posts"],
    queryFn: fetchPosts,
    staleTime: 10 * 60_000,
  });

  const keyword = search.trim().toLowerCase();
  const filteredPosts = posts
    ? posts
        .filter((p) =>
          filter === "mine" ? p.authorEmail === currentUserEmail.toLowerCase() : true
        )
        .filter((p) =>
          keyword ? p.title.toLowerCase().includes(keyword) : true
        )
        .sort((a, b) => {
          // Notices always on top
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return sort === "newest" ? -diff : diff;
        })
    : [];

  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const myPostCount = posts
    ? posts.filter((p) => p.authorEmail === currentUserEmail.toLowerCase()).length
    : 0;

  function handleFilterChange(tab: FilterTab) {
    setFilter(tab);
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">게시판</h2>
          <p className="mt-1 text-sm text-gray-500">
            공지사항 확인 및 샘플 요청을 할 수 있습니다.
          </p>
        </div>
        <Link
          href="/board/write"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800"
        >
          글쓰기
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => handleFilterChange("all")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
            filter === "all"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          전체
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange("mine")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
            filter === "mine"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          내 글{myPostCount > 0 && (
            <span className="ml-1 text-[10px] text-indigo-500">{myPostCount}</span>
          )}
        </button>
      </div>

      {/* Search + Sort */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <title>검색</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="제목으로 검색"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortOrder);
            setCurrentPage(1);
          }}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-3 border-gray-900 border-t-transparent animate-spin" />
        </div>
      )}

      {isError && (
        <div className="py-20 text-center text-sm font-medium text-red-600">
          게시글을 불러오지 못했습니다. 페이지를 새로고침해 주세요.
        </div>
      )}

      {!isLoading && !isError && posts && (
        <PostList
          posts={paginatedPosts}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          currentUserEmail={currentUserEmail}
        />
      )}
    </div>
  );
}
