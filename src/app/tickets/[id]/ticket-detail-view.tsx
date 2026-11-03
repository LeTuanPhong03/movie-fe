"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import clsx from "clsx";
import { ArrowLeft, TicketX } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { keys, useReservation } from "@/lib/queries";
import { useNow } from "@/lib/hooks";
import {
  formatDate,
  formatMoney,
  formatTime,
  formatWeekday,
  parseUtc,
} from "@/lib/format";
import { seatLabel } from "@/components/reservation-summary";
import {
  Button,
  ConfirmDialog,
  Container,
  EmptyState,
  ErrorState,
  LinkButton,
  Skeleton,
  StatusBadge,
} from "@/components/ui";

export function TicketDetailView({ id }: { id: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: r, isPending, error, refetch } = useReservation(id);
  const now = useNow(30_000);
  const [askCancel, setAskCancel] = useState(false);

  // Vé hiển thị như một tấm thẻ nổi: bấm ra ngoài hoặc nhấn Esc là về danh sách vé
  useEffect(() => {
    if (askCancel) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && router.push("/tickets");
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [askCancel, router]);

  const onBackdropClick = (e: React.MouseEvent) => {
    if (!(e.target as Element).closest("[data-ticket-keep]"))
      router.push("/tickets");
  };

  const cancel = useMutation({
    mutationFn: () => api(`/api/reservations/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Đã huỷ vé");
      setAskCancel(false);
      queryClient.invalidateQueries({ queryKey: keys.reservation(id) });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (error) {
    return (
      <Container className="pt-16">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            icon={<TicketX className="size-6" />}
            title="Không tìm thấy vé"
            action={<LinkButton href="/tickets">Vé của tôi</LinkButton>}
          />
        ) : (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        )}
      </Container>
    );
  }

  if (isPending) {
    return (
      <Container className="max-w-md pt-8">
        <Skeleton className="h-[560px] rounded-3xl" />
      </Container>
    );
  }

  const notStarted = now !== null && parseUtc(r.startAt).getTime() > now;
  // BE cho huỷ đơn Pending/Confirmed của suất chưa chiếu (đơn Confirmed huỷ thì cần hoàn tiền tay)
  const canCancel =
    (r.status === "Pending" || r.status === "Confirmed") && notStarted;
  const valid = r.status === "Confirmed";
  const code = `MV${r.id.toString().padStart(6, "0")}`;

  return (
    <div onClick={onBackdropClick} className="min-h-[calc(100dvh-4rem)] pb-10">
      <Container className="max-w-md pt-6">
        <Link
          href="/tickets"
          data-ticket-keep
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Vé của tôi
        </Link>

        <article
          data-ticket-keep
          className={clsx(
            "mt-5 animate-fade-up overflow-hidden rounded-3xl shadow-2xl shadow-black/50",
            !valid && "grayscale-[0.6]",
          )}
        >
          <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                CineViet · Vé xem phim
              </span>
              <StatusBadge status={r.status} />
            </div>
            <h1 className="relative mt-4 text-2xl font-black leading-tight text-white">
              {r.movieTitle}
            </h1>
            <p className="relative mt-1 text-sm text-white/80">
              2D Phụ đề · {r.theaterName}
            </p>
          </div>

          <div className="bg-ink-800 p-6">
            <div className="grid grid-cols-2 gap-5">
              <Info
                label="Ngày chiếu"
                value={formatDate(r.startAt)}
                sub={formatWeekday(r.startAt)}
              />
              <Info
                label="Giờ chiếu"
                value={formatTime(r.startAt)}
                sub={`Kết thúc ${formatTime(r.movieEndAt)}`}
              />
              <Info label="Phòng" value={r.theaterName} />
              <Info
                label={`Ghế (${r.seats.length})`}
                value={seatLabel(r.seats)}
              />
            </div>
          </div>

          <div className="ticket-cut h-5 bg-transparent" />

          <div className="bg-ink-800 px-6 pb-6 pt-2 text-center">
            <Barcode seed={r.id} />
            <p className="mt-2 font-mono text-sm tracking-[0.35em] text-ink-300">
              {code}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-ink-700 pt-4 text-sm">
              <span className="text-ink-400">Tổng thanh toán</span>
              <span className="text-xl font-black text-gold-400">
                {formatMoney(r.totalPrice)}
              </span>
            </div>
            {!valid && (
              <p className="mt-3 rounded-xl bg-ink-900 px-3 py-2 text-xs text-ink-400">
                {r.status === "Pending"
                  ? "Vé chỉ có hiệu lực sau khi thanh toán."
                  : "Vé này không còn hiệu lực."}
              </p>
            )}
          </div>
        </article>

        <div data-ticket-keep className="mt-5 flex flex-col gap-2">
          {r.status === "Pending" && (
            <LinkButton href={`/checkout/${r.id}`}>
              Tiếp tục thanh toán
            </LinkButton>
          )}
          {(r.status === "Cancelled" || r.status === "Expired") &&
            notStarted && (
              <LinkButton href={`/booking/${r.showtimeId}`}>
                Đặt lại suất này
              </LinkButton>
            )}
          {canCancel && (
            <Button variant="danger" onClick={() => setAskCancel(true)}>
              Huỷ vé
            </Button>
          )}
        </div>

        <div data-ticket-keep>
          <ConfirmDialog
            open={askCancel}
            onClose={() => setAskCancel(false)}
            onConfirm={() => cancel.mutate()}
            loading={cancel.isPending}
            title="Huỷ vé này?"
            description={
              r.status === "Confirmed"
                ? "Vé đã thanh toán. Sau khi huỷ, ghế được nhả và bạn cần liên hệ rạp để được hoàn tiền."
                : "Ghế bạn đang giữ sẽ được nhả cho người khác."
            }
            confirmLabel="Huỷ vé"
          />
        </div>
        <p className="mt-6 text-center text-xs text-ink-600">
          Bấm ra ngoài vé hoặc nhấn Esc để quay lại
        </p>
      </Container>
    </div>
  );
}

function Info({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold leading-tight text-white">{value}</p>
      {sub && <p className="text-xs text-ink-400">{sub}</p>}
    </div>
  );
}

/** Mã vạch trang trí, sinh từ mã đơn (không phải mã quét thật — BE chưa có API soát vé). */
function barWidths(seed: number) {
  const widths: number[] = [];
  let x = seed * 9301 + 49297;
  for (let i = 0; i < 46; i++) {
    x = (x * 9301 + 49297) % 233280;
    widths.push(1 + Math.floor((x / 233280) * 3));
  }
  return widths;
}

function Barcode({ seed }: { seed: number }) {
  const bars = barWidths(seed);
  return (
    <div className="mx-auto flex h-16 w-full max-w-[280px] items-stretch justify-center gap-[2px] rounded-lg bg-white px-3 py-2">
      {bars.map((w, i) => (
        <span
          key={i}
          className={i % 2 === 0 ? "bg-ink-950" : "bg-transparent"}
          style={{ width: w * 1.5 }}
        />
      ))}
    </div>
  );
}
