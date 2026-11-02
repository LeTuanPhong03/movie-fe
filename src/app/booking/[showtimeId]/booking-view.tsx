"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Clock, MapPin, RefreshCw, Ticket } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { keys, useMovieLookup, useSeatMap, useShowtime } from "@/lib/queries";
import { useNow, useSession } from "@/lib/hooks";
import { formatDate, formatMoney, formatTime, formatWeekday, parseUtc } from "@/lib/format";
import { MAX_SEATS, type ReservationDto, type SeatStatusDto } from "@/lib/types";
import { Poster } from "@/components/poster";
import { SeatLegend, SeatMap } from "@/components/seat-map";
import { Button, Container, EmptyState, ErrorState, LinkButton, Skeleton } from "@/components/ui";
import { Steps } from "@/components/steps";

// Ghế đang chọn được nhớ trong sessionStorage: khách chưa đăng nhập bấm "Tiếp tục" → sang trang đăng nhập → quay lại vẫn còn ghế.
const storageKey = (id: number) => `booking.seats.${id}`;

function loadSelection(showtimeId: number): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(showtimeId)) ?? "[]");
  } catch {
    return [];
  }
}

export function BookingView({ showtimeId }: { showtimeId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const now = useNow(15_000);
  const showtime = useShowtime(showtimeId);
  const seatMap = useSeatMap(showtimeId);
  const lookup = useMovieLookup();
  const [selectedIds, setSelectedIds] = useState<number[]>(() => loadSelection(showtimeId));

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey(showtimeId), JSON.stringify(selectedIds));
    } catch {}
  }, [selectedIds, showtimeId]);

  const seatsById = useMemo(() => new Map((seatMap.data?.seats ?? []).map((s) => [s.id, s])), [seatMap.data]);

  // Ghế đang chọn mà vừa bị người khác giữ (thấy sau lần làm mới sơ đồ) thì tự bỏ ra khỏi lựa chọn.
  const selected = useMemo(
    () => (seatMap.data ? selectedIds.filter((id) => seatsById.get(id)?.status === "Available") : selectedIds),
    [selectedIds, seatsById, seatMap.data],
  );
  const notified = useRef(new Set<number>());
  useEffect(() => {
    if (!seatMap.data) return;
    const lost = selectedIds.filter((id) => !selected.includes(id) && !notified.current.has(id));
    if (lost.length > 0) {
      lost.forEach((id) => notified.current.add(id));
      const names = lost.map((id) => seatsById.get(id)).filter(Boolean).map((s) => `${s!.row}${s!.number}`);
      toast.warning(names.length ? `Ghế ${names.join(", ")} vừa có người khác giữ` : "Một số ghế đã không còn trống");
    }
  }, [selected, selectedIds, seatMap.data, seatsById]);

  const selectedSeats = selected
    .map((id) => seatsById.get(id))
    .filter((s): s is SeatStatusDto => !!s)
    .sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number);

  const toggle = (seat: SeatStatusDto) => {
    if (selected.includes(seat.id)) {
      setSelectedIds(selected.filter((id) => id !== seat.id));
      return;
    }
    if (selected.length >= MAX_SEATS) {
      toast.error(`Mỗi lần đặt tối đa ${MAX_SEATS} ghế`);
      return;
    }
    notified.current.delete(seat.id);
    setSelectedIds([...selected, seat.id]);
  };

  const reserve = useMutation({
    mutationFn: () => api<ReservationDto>("/api/reservations", { method: "POST", body: { showtimeId, seatIds: selected } }),
    onSuccess: (reservation) => {
      sessionStorage.removeItem(storageKey(showtimeId));
      queryClient.setQueryData(keys.reservation(reservation.id), reservation);
      queryClient.invalidateQueries({ queryKey: keys.seats(showtimeId) });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast.success("Đã giữ ghế trong 10 phút");
      router.push(`/checkout/${reservation.id}`);
    },
    onError: (error) => {
      // 409: ghế vừa bị người khác giữ (BE chống double-booking) → tải lại sơ đồ để khách chọn lại
      if (error instanceof ApiError && error.status === 409) {
        seatMap.refetch();
      }
      toast.error(error.message);
    },
  });

  const onContinue = () => {
    if (!session) {
      toast.info("Đăng nhập để giữ ghế bạn đã chọn");
      router.push(`/login?next=${encodeURIComponent(`/booking/${showtimeId}`)}`);
      return;
    }
    reserve.mutate();
  };

  if (showtime.error) {
    return (
      <Container className="pt-16">
        {showtime.error instanceof ApiError && showtime.error.status === 404 ? (
          <EmptyState
            icon={<CalendarDays className="size-6" />}
            title="Không tìm thấy suất chiếu"
            action={<LinkButton href="/showtimes">Xem lịch chiếu</LinkButton>}
          />
        ) : (
          <ErrorState message={showtime.error.message} onRetry={() => showtime.refetch()} />
        )}
      </Container>
    );
  }

  const st = showtime.data;
  const movie = st ? lookup.get(st.movieId) : undefined;
  const started = st && now !== null && parseUtc(st.startAt).getTime() <= now;
  const total = (st?.price ?? 0) * selectedSeats.length;
  const available = seatMap.data?.seats.filter((s) => s.status === "Available").length ?? 0;

  return (
    <div className="pb-32 lg:pb-0">
      <Container className="pt-6">
        <Link
          href={movie ? `/movies/${movie.id}` : "/showtimes"}
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Đổi suất chiếu
        </Link>

        <Steps current={1} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Sơ đồ ghế */}
          <section className="min-w-0 rounded-3xl border border-ink-700 bg-ink-900/70 p-4 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-extrabold text-white sm:text-xl">Chọn ghế</h1>
                <p className="text-xs text-ink-400">
                  {seatMap.data ? `Còn ${available}/${seatMap.data.seats.length} ghế trống` : "Đang tải sơ đồ…"} · tối đa {MAX_SEATS} ghế
                </p>
              </div>
              <button
                onClick={() => seatMap.refetch()}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-400 transition hover:bg-ink-800 hover:text-white"
              >
                <RefreshCw className={seatMap.isFetching ? "size-3.5 animate-spin" : "size-3.5"} /> Làm mới
              </button>
            </div>

            {started && (
              <div className="mb-6 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-300">
                Suất chiếu này đã bắt đầu, không thể đặt vé nữa.
              </div>
            )}

            {seatMap.error ? (
              <ErrorState message={seatMap.error.message} onRetry={() => seatMap.refetch()} />
            ) : seatMap.isPending ? (
              <div className="space-y-2">
                <Skeleton className="mx-auto mb-10 h-12 w-3/4" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="mx-auto h-8 w-full max-w-xl" />
                ))}
              </div>
            ) : (
              <>
                <SeatMap seats={seatMap.data.seats} selected={new Set(selected)} onToggle={toggle} disabled={!!started} />
                <div className="mt-8 border-t border-ink-800 pt-5">
                  <SeatLegend />
                </div>
              </>
            )}
          </section>

          {/* Tóm tắt đơn (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-ink-700 bg-ink-850 p-5">
              <ShowtimeSummary loading={showtime.isPending} st={st} movie={movie} />
              <div className="my-5 h-px bg-ink-700" />
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-ink-400">Ghế</span>
                <span className="text-right font-semibold text-white">
                  {selectedSeats.length ? selectedSeats.map((s) => `${s.row}${s.number}`).join(", ") : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-ink-400">Giá vé</span>
                <span className="text-ink-300">
                  {st ? formatMoney(st.price) : "—"} × {selectedSeats.length}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="text-sm text-ink-400">Tạm tính</span>
                <span className="text-2xl font-black text-gold-400">{formatMoney(total)}</span>
              </div>
              <Button
                size="lg"
                className="mt-5 w-full"
                disabled={selectedSeats.length === 0 || !!started}
                loading={reserve.isPending}
                onClick={onContinue}
              >
                <Ticket className="size-5" /> {session ? "Giữ ghế & thanh toán" : "Đăng nhập để đặt vé"}
              </Button>
              <p className="mt-3 text-center text-xs text-ink-500">Ghế được giữ 10 phút sau khi bấm.</p>
            </div>
          </aside>
        </div>
      </Container>

      {/* Thanh tóm tắt dính đáy (mobile/tablet) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-700 bg-ink-900/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-400">
              {st ? `${st.title} · ${formatTime(st.startAt)}` : "…"}
              {selectedSeats.length > 0 && ` · ${selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}`}
            </p>
            <p className="text-xl font-black text-gold-400">{formatMoney(total)}</p>
          </div>
          <Button disabled={selectedSeats.length === 0 || !!started} loading={reserve.isPending} onClick={onContinue}>
            {session ? "Tiếp tục" : "Đăng nhập"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShowtimeSummary({
  loading,
  st,
  movie,
}: {
  loading: boolean;
  st?: { title: string; startAt: string; movieEndAt: string; theaterName: string };
  movie?: { posterUrl: string | null; genre: string; suitableAge: number };
}) {
  if (loading || !st) {
    return (
      <div className="flex gap-4">
        <Skeleton className="h-28 w-20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-4">
      <Poster title={st.title} posterUrl={movie?.posterUrl} genre={movie?.genre} suitableAge={movie?.suitableAge} className="w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 space-y-1.5">
        <h2 className="font-bold leading-snug text-white">{st.title}</h2>
        <p className="flex items-center gap-1.5 text-xs text-ink-400">
          <MapPin className="size-3.5" /> {st.theaterName}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-ink-400">
          <CalendarDays className="size-3.5" /> {formatWeekday(st.startAt)}, {formatDate(st.startAt)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-ink-400">
          <Clock className="size-3.5" /> {formatTime(st.startAt)} – {formatTime(st.movieEndAt)}
        </p>
      </div>
    </div>
  );
}
