/* eslint-disable @next/next/no-img-element -- poster là URL tuỳ ý admin nhập, không biết trước domain để cấu hình next/image */
"use client";

import { useState } from "react";
import clsx from "clsx";
import { Clapperboard } from "lucide-react";
import { ageRating } from "@/lib/format";

// Phim không có poster (dữ liệu demo) → vẽ poster giả bằng gradient. Màu chọn theo tên phim nên mỗi phim một màu cố định.
const palettes = [
  ["#e50914", "#3b0a45"],
  ["#f59e0b", "#7c2d12"],
  ["#06b6d4", "#1e1b4b"],
  ["#8b5cf6", "#0f172a"],
  ["#10b981", "#052e16"],
  ["#ec4899", "#4a044e"],
  ["#3b82f6", "#111827"],
];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function posterGradient(title: string) {
  const [a, b] = palettes[hash(title) % palettes.length];
  return `radial-gradient(120% 80% at 20% 10%, ${a} 0%, transparent 60%), linear-gradient(160deg, ${a}99 0%, ${b} 70%, #050507 100%)`;
}

export function Poster({
  title,
  posterUrl,
  genre,
  suitableAge,
  className,
  showBadge = true,
}: {
  title: string;
  posterUrl?: string | null;
  genre?: string;
  suitableAge?: number;
  className?: string;
  showBadge?: boolean;
}) {
  const rating = suitableAge !== undefined ? ageRating(suitableAge) : null;
  // Link ảnh hỏng (404, không phải ảnh) → rơi về poster gradient thay vì hiện icon ảnh vỡ
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!posterUrl && failedUrl !== posterUrl;
  return (
    <div className={clsx("@container relative aspect-[2/3] overflow-hidden rounded-2xl bg-ink-800", className)}>
      {showImage ? (
        <img
          src={posterUrl}
          alt={title}
          loading="lazy"
          onError={() => setFailedUrl(posterUrl)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        // Cỡ chữ theo bề rộng poster (container query): poster nhỏ ở danh sách vẫn đọc được, không bị cắt chữ
        <div className="absolute inset-0 flex flex-col justify-end p-2 @[140px]:p-4" style={{ background: posterGradient(title) }}>
          <Clapperboard className="absolute right-2 top-2 size-4 text-white/25 @[140px]:right-4 @[140px]:top-4 @[140px]:size-8" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/10" />
          {genre && (
            <span className="mb-1 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 @[140px]:block">{genre}</span>
          )}
          <span className="line-clamp-3 break-words text-[9px] font-black uppercase leading-tight text-white drop-shadow @[100px]:text-xs @[140px]:text-lg">
            {title}
          </span>
        </div>
      )}
      {showBadge && rating && (
        <span className={clsx("absolute left-2.5 top-2.5 rounded-md px-1.5 py-0.5 text-[11px] font-black", rating.className)}>
          {rating.label}
        </span>
      )}
    </div>
  );
}
