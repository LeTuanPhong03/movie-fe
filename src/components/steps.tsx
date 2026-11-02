"use client";

import clsx from "clsx";

/** Thanh tiến trình 3 bước của luồng đặt vé. */
export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Chọn ghế", "Thanh toán", "Nhận vé"];
  return (
    <ol className="mt-5 flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "active" : "todo";
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={
                state === "active"
                  ? "grid size-6 place-items-center rounded-full bg-brand-500 text-[11px] font-bold text-white"
                  : state === "done"
                    ? "grid size-6 place-items-center rounded-full bg-emerald-500 text-[11px] font-bold text-white"
                    : "grid size-6 place-items-center rounded-full bg-ink-700 text-[11px] font-bold text-ink-400"
              }
            >
              {n}
            </span>
            <span className={clsx("whitespace-nowrap", state === "todo" ? "text-ink-500" : "font-medium text-white")}>{label}</span>
            {n < steps.length && <span className="mx-0.5 h-px w-4 bg-ink-600 sm:mx-1 sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
