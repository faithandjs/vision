import type { Metadata } from "next";
import EditJournalEntry from "@/components/journal/JournalEntryEditor";

export const metadata: Metadata = { title: "New journal entry" };

export default function Page() {
  return <EditJournalEntry entryId={null} />;
}
