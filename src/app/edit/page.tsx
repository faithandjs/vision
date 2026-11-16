import type { Metadata } from "next";
import EditBoard from "@/components/editor/EditBoard";

export const metadata: Metadata = { title: "Edit board" };

export default function EditPage() {
  return <EditBoard />;
}
