import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { BookingView } from "./booking-view";

export const metadata: Metadata = { title: "Chọn ghế" };

export default function BookingPage({ params }: PageProps<"/booking/[showtimeId]">) {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner className="size-8" /></div>}>
      {params.then(({ showtimeId }) => (
        <BookingView showtimeId={Number(showtimeId)} />
      ))}
    </Suspense>
  );
}
