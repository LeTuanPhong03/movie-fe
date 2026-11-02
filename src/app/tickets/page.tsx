import type { Metadata } from "next";
import { RequireAuth } from "@/components/require-auth";
import { TicketsView } from "./tickets-view";

export const metadata: Metadata = { title: "Vé của tôi" };

export default function TicketsPage() {
  return (
    <RequireAuth>
      <TicketsView />
    </RequireAuth>
  );
}
