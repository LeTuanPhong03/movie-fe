"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ShowtimeDto } from "@/lib/types";
import { formatMoney, formatTime } from "@/lib/format";

/** Các suất của một phim, gom theo phòng chiếu; mỗi suất là một nút giờ bấm vào để chọn ghế. */
export function ShowtimeChips({ showtimes }: { showtimes: ShowtimeDto[] }) {
  const byTheater = new Map<string, ShowtimeDto[]>();
  for (const s of showtimes) {
    byTheater.set(s.theaterName, [...(byTheater.get(s.theaterName) ?? []), s]);
  }

  return (
    <div className="space-y-4">
      {[...byTheater.entries()].map(([theater, list]) => (
        <div key={theater}>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            <MapPin className="size-3.5" /> {theater} · 2D Phụ đề
          </p>
          <div className="flex flex-wrap gap-2">
            {list.map((s) => (
              <Link
                key={s.id}
                href={`/booking/${s.id}`}
                className="group flex min-w-[92px] flex-col items-center rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500/10"
              >
                <span className="text-base font-bold text-white">{formatTime(s.startAt)}</span>
                <span className="text-[11px] text-ink-400 group-hover:text-gold-300">{formatMoney(s.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
