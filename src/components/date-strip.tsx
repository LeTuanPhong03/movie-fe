"use client";

import clsx from "clsx";
import { addDays, describeDay } from "@/lib/format";
import { Skeleton } from "./ui";

/** Dải chọn ngày 7 ngày tới (demo seed suất chiếu đúng 7 ngày). Cuộn ngang trên mobile. */
export function DateStrip({
  today,
  value,
  onChange,
  days = 7,
}: {
  today: string | null;
  value: string | null;
  onChange: (day: string) => void;
  days?: number;
}) {
  if (!today) {
    return (
      <div className="flex gap-2.5">
        {Array.from({ length: days }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-[68px] shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {Array.from({ length: days }).map((_, i) => {
        const day = addDays(today, i);
        const info = describeDay(day, today);
        const active = day === value;
        return (
          <button
            key={day}
            onClick={() => onChange(day)}
            className={clsx(
              "flex h-[76px] w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl border transition-all duration-200",
              active
                ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-500 hover:text-white",
            )}
          >
            <span className={clsx("text-[11px] font-medium", !active && info.isWeekend && "text-gold-400")}>{info.label}</span>
            <span className="text-2xl font-black leading-none">{info.dayOfMonth}</span>
            <span className={clsx("text-[10px]", active ? "text-white/80" : "text-ink-500")}>Th {info.month}</span>
          </button>
        );
      })}
    </div>
  );
}
