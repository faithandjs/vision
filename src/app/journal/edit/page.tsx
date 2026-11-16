import type { Metadata } from "next";
import EditJournal from "@/components/editor/EditJournal";

export const metadata: Metadata = { title: "Edit journal" };

export default function Page() {
  return <EditJournal />;
}
