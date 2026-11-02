import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Spinner } from "@/components/ui";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = { title: "Thanh toán" };

export default function CheckoutPage({ params }: PageProps<"/checkout/[id]">) {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner className="size-8" /></div>}>
      {params.then(({ id }) => (
        <RequireAuth>
          <CheckoutView id={Number(id)} />
        </RequireAuth>
      ))}
    </Suspense>
  );
}
