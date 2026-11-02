"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import clsx from "clsx";
import { AlarmClock, CheckCircle2, CreditCard, FlaskConical, ShieldCheck, TicketX } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { keys, useReservation } from "@/lib/queries";
import { useNow } from "@/lib/hooks";
import { parseUtc } from "@/lib/format";
import { HOLD_MINUTES, type PaymentLinkDto } from "@/lib/types";
import { ReservationSummary } from "@/components/reservation-summary";
import { Steps } from "@/components/steps";
import { Button, ConfirmDialog, Container, EmptyState, ErrorState, LinkButton, Skeleton, StatusBadge } from "@/components/ui";

const allowManualConfirm = process.env.NEXT_PUBLIC_ALLOW_MANUAL_CONFIRM === "true";

export function CheckoutView({ id }: { id: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: reservation, isPending, error, refetch } = useReservation(id);
  const now = useNow(1000);
  const [askCancel, setAskCancel] = useState(false);

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: keys.reservation(id) });
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    if (reservation) queryClient.invalidateQueries({ queryKey: keys.seats(reservation.showtimeId) });
  };

  const pay = useMutation({
    mutationFn: () => api<PaymentLinkDto>(`/api/reservations/${id}/payments`, { method: "POST" }),
    // Chuyển hẳn trình duyệt sang cổng VNPay; xong VNPay đưa khách về /payment/vnpay-return
    onSuccess: (link) => window.location.assign(link.paymentUrl),
    // BE trả 500 (không kèm lý do, đúng chuẩn không lộ lỗi nội bộ) khi chưa cấu hình VnPay:TmnCode/HashSecret
    onError: (e) =>
      toast.error(
        e instanceof ApiError && e.status === 500
          ? "Không tạo được link VNPay. Máy chủ có thể chưa cấu hình VNPay sandbox."
          : e.message,
      ),
  });

  const confirm = useMutation({
    mutationFn: () => api(`/api/reservations/${id}/confirm`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Thanh toán thành công! Vé đã được xác nhận.");
      refreshAll();
      router.push(`/tickets/${id}`);
    },
    onError: (e) =>
      toast.error(e instanceof ApiError && e.status === 404 ? "Môi trường này không bật thanh toán thử. Hãy dùng VNPay." : e.message),
  });

  const cancel = useMutation({
    mutationFn: () => api(`/api/reservations/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Đã huỷ đơn và nhả ghế");
      setAskCancel(false);
      refreshAll();
      router.push("/tickets");
    },
    onError: (e) => toast.error(e.message),
  });

  if (error) {
    return (
      <Container className="pt-16">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState icon={<TicketX className="size-6" />} title="Không tìm thấy đơn" action={<LinkButton href="/tickets">Vé của tôi</LinkButton>} />
        ) : (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        )}
      </Container>
    );
  }

  if (isPending) {
    return (
      <Container className="max-w-4xl pt-8">
        <Skeleton className="h-8 w-60" />
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
          <Skeleton className="h-80" />
          <Skeleton className="h-64" />
        </div>
      </Container>
    );
  }

  const expiresAt = parseUtc(reservation.expiresAt).getTime();
  const remaining = now === null ? null : Math.max(0, expiresAt - now);
  // Hết giờ đếm ngược thì coi như hết hạn ngay (BE cũng hết hạn "lười" theo ExpiresAt, không chờ job 30 giây)
  const expired = reservation.status === "Expired" || (reservation.status === "Pending" && remaining === 0);
  const canPay = reservation.status === "Pending" && !expired;
  const busy = pay.isPending || confirm.isPending || cancel.isPending;

  return (
    <Container className="max-w-5xl pt-6">
      <Steps current={canPay ? 2 : 3} />

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_340px]">
        <section className="animate-fade-up rounded-3xl border border-ink-700 bg-ink-900/70 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold text-white">Xác nhận đơn hàng</h1>
            <StatusBadge status={expired ? "Expired" : reservation.status} />
          </div>
          <ReservationSummary reservation={reservation} />
        </section>

        <aside className="animate-fade-up space-y-4 [animation-delay:80ms]">
          {canPay ? (
            <>
              <Countdown remaining={remaining} />
              <div className="rounded-3xl border border-ink-700 bg-ink-850 p-5">
                <h2 className="font-bold text-white">Phương thức thanh toán</h2>
                <Button size="lg" className="mt-4 w-full" onClick={() => pay.mutate()} loading={pay.isPending} disabled={busy}>
                  <CreditCard className="size-5" /> Thanh toán qua VNPay
                </Button>
                {allowManualConfirm && (
                  <Button variant="outline" className="mt-2.5 w-full" onClick={() => confirm.mutate()} loading={confirm.isPending} disabled={busy}>
                    <FlaskConical className="size-4" /> Thanh toán thử (môi trường dev)
                  </Button>
                )}
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-400">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  Bạn sẽ được chuyển sang cổng VNPay. Thẻ test sandbox: NCB · 9704198526191432198 · NGUYEN VAN A · 07/15 · OTP 123456.
                </p>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setAskCancel(true)} disabled={busy}>
                Huỷ đơn, chọn lại ghế
              </Button>
            </>
          ) : reservation.status === "Confirmed" ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto size-12 text-emerald-400" />
              <h2 className="mt-3 text-lg font-bold text-white">Đơn đã thanh toán</h2>
              <p className="mt-1 text-sm text-ink-300">Vé của bạn đã sẵn sàng.</p>
              <LinkButton href={`/tickets/${id}`} className="mt-5 w-full">
                Xem vé
              </LinkButton>
            </div>
          ) : (
            <div className="rounded-3xl border border-ink-700 bg-ink-850 p-6 text-center">
              <TicketX className="mx-auto size-12 text-ink-400" />
              <h2 className="mt-3 text-lg font-bold text-white">{expired ? "Đơn đã hết hạn giữ ghế" : "Đơn đã bị huỷ"}</h2>
              <p className="mt-1 text-sm text-ink-400">Ghế đã được nhả cho người khác. Bạn có thể đặt lại.</p>
              <LinkButton href={`/booking/${reservation.showtimeId}`} className="mt-5 w-full">
                Đặt lại suất này
              </LinkButton>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={askCancel}
        onClose={() => setAskCancel(false)}
        onConfirm={() => cancel.mutate()}
        loading={cancel.isPending}
        title="Huỷ đơn này?"
        description="Các ghế bạn đang giữ sẽ được nhả ngay cho người khác."
        confirmLabel="Huỷ đơn"
      />
    </Container>
  );
}

function Countdown({ remaining }: { remaining: number | null }) {
  const total = HOLD_MINUTES * 60_000;
  const secs = remaining === null ? null : Math.ceil(remaining / 1000);
  const mm = secs === null ? "--" : Math.floor(secs / 60).toString().padStart(2, "0");
  const ss = secs === null ? "--" : (secs % 60).toString().padStart(2, "0");
  const urgent = secs !== null && secs <= 60;
  const pct = remaining === null ? 100 : Math.min(100, (remaining / total) * 100);

  return (
    <div
      className={clsx(
        "rounded-3xl border p-5 transition-colors",
        urgent ? "border-brand-500/50 bg-brand-500/10" : "border-gold-500/30 bg-gold-500/5",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={clsx("flex items-center gap-2 text-sm font-medium", urgent ? "text-brand-300" : "text-gold-300")}>
          <AlarmClock className={clsx("size-4", urgent && "animate-pulse")} /> Thời gian giữ ghế
        </span>
        <span className={clsx("font-mono text-3xl font-black tabular-nums", urgent ? "text-brand-300" : "text-white")}>
          {mm}:{ss}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
        <div
          className={clsx("h-full rounded-full transition-[width] duration-1000 ease-linear", urgent ? "bg-brand-500" : "bg-gold-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
