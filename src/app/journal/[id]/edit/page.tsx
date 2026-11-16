import type { Metadata } from "next";
import EditJournalEntry from "@/components/journal/JournalEntryEditor";

export const metadata: Metadata = { title: "Edit journal entry" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditJournalEntry entryId={decodeURIComponent(id)} />;
}
