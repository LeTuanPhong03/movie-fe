"use client";

import { CalendarDays, Clock, MapPin, Armchair } from "lucide-react";
import type { ReservationDto } from "@/lib/types";
import { formatDate, formatMoney, formatTime, formatWeekday } from "@/lib/format";
import { useMovieLookup } from "@/lib/queries";
import { Poster } from "./poster";

export const seatLabel = (seats: ReservationDto["seats"]) => seats.map((s) => `${s.row}${s.number}`).join(", ");

/** Khối thông tin đơn: phim, phòng, giờ, ghế, tổng tiền — dùng ở trang thanh toán và chi tiết vé. */
export function ReservationSummary({ reservation }: { reservation: ReservationDto }) {
  const movie = useMovieLookup().get(reservation.movieId);
  return (
    <div>
      <div className="flex gap-4">
        <Poster
          title={reservation.movieTitle}
          posterUrl={movie?.posterUrl}
          genre={movie?.genre}
          suitableAge={movie?.suitableAge}
          className="w-20 shrink-0 rounded-xl sm:w-24"
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">{reservation.movieTitle}</h2>
          <p className="mt-1 text-xs text-ink-400">Mã đơn #{reservation.id.toString().padStart(6, "0")}</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Item icon={<MapPin className="size-4" />} label="Phòng chiếu" value={reservation.theaterName} />
        <Item icon={<CalendarDays className="size-4" />} label="Ngày" value={`${formatWeekday(reservation.startAt)}, ${formatDate(reservation.startAt)}`} />
        <Item icon={<Clock className="size-4" />} label="Suất" value={`${formatTime(reservation.startAt)} – ${formatTime(reservation.movieEndAt)}`} />
        <Item icon={<Armchair className="size-4" />} label={`Ghế (${reservation.seats.length})`} value={seatLabel(reservation.seats)} />
      </dl>
      <div className="mt-5 flex items-end justify-between border-t border-dashed border-ink-600 pt-4">
        <span className="text-sm text-ink-400">Tổng tiền</span>
        <span className="text-2xl font-black text-gold-400">{formatMoney(reservation.totalPrice)}</span>
      </div>
    </div>
  );
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-ink-500">
        {icon} {label}
      </dt>
      <dd className="mt-1 font-semibold text-white">{value}</dd>
    </div>
  );
}
