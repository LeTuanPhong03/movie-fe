import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Spinner } from "@/components/ui";
import { TicketDetailView } from "./ticket-detail-view";

export const metadata: Metadata = { title: "Chi tiết vé" };

export default function TicketDetailPage({ params }: PageProps<"/tickets/[id]">) {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner className="size-8" /></div>}>
      {params.then(({ id }) => (
        <RequireAuth>
          <TicketDetailView id={Number(id)} />
        </RequireAuth>
      ))}
    </Suspense>
  );
}
