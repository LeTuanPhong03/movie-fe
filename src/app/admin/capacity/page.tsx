import type { Metadata } from "next";
import { CapacityView } from "./capacity-view";

export const metadata: Metadata = { title: "Công suất" };

export default function AdminCapacityPage() {
  return <CapacityView />;
}
