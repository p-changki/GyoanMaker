import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import PostForm from "@/components/board/PostForm";

export default async function BoardWritePage() {
  const session = await auth();
  const admin = isAdmin(session?.user?.email);

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-xl font-bold text-gray-900">글쓰기</h2>
      <PostForm isAdmin={admin} userEmail={session?.user?.email ?? ""} />
    </div>
  );
}
