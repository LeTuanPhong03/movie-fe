import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { VnPayReturnView } from "./vnpay-return-view";

export const metadata: Metadata = { title: "Kết quả thanh toán" };

export default function VnPayReturnPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner className="size-8" /></div>}>
      <VnPayReturnView />
    </Suspense>
  );
}
