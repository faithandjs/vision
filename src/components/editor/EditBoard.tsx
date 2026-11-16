"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/context/AuthProvider";
import { useBoard } from "@/context/BoardProvider";
import BoardEditor from "./BoardEditor";

/** Auth guard + loading state around the editor. */
export default function EditBoard() {
  const { user, loading: authLoading } = useAuth();
  const { board, source, loading } = useBoard();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/signin?next=/edit");
  }, [authLoading, user, router]);

  if (loading || !user) {
    return (
      <>
        <SiteHeader />
        <main aria-busy="true" className="mx-auto max-w-3xl animate-pulse px-4 py-14 sm:px-6">
          <div className="h-12 w-2/3 rounded-2xl bg-surface-muted" />
          <div className="mt-10 h-48 rounded-3xl bg-surface-muted" />
          <div className="mt-6 h-96 rounded-3xl bg-surface-muted" />
        </main>
      </>
    );
  }

  return <BoardEditor key={user.uid} uid={user.uid} initial={board} isStarter={source === "starter"} />;
}
