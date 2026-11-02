"use client";

import Link from "next/link";
import { Clock, Ticket } from "lucide-react";
import type { MovieDto } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { Poster } from "./poster";
import { Skeleton } from "./ui";

export function MovieCard({ movie, index = 0 }: { movie: MovieDto; index?: number }) {
  return (
    <div className="group animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <Link href={`/movies/${movie.id}`} className="relative block">
        <Poster
          title={movie.title}
          posterUrl={movie.posterUrl}
          genre={movie.genre}
          suitableAge={movie.suitableAge}
          className="shadow-xl shadow-black/40 ring-1 ring-white/5 transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-brand-500/20 group-hover:ring-brand-500/40"
        />
        {/* Lớp phủ khi rê chuột (desktop) */}
        <div className="absolute inset-0 hidden items-end rounded-2xl bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 opacity-0 transition duration-300 group-hover:-translate-y-1.5 group-hover:opacity-100 md:flex">
          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white shadow-lg">
            <Ticket className="size-4" /> Đặt vé
          </span>
        </div>
      </Link>
      <div className="mt-3 px-0.5">
        <Link href={`/movies/${movie.id}`} className="line-clamp-1 font-bold text-white transition hover:text-brand-300">
          {movie.title}
        </Link>
        <div className="mt-1 flex items-center gap-2 text-xs text-ink-400">
          <span className="line-clamp-1">{movie.genre}</span>
          <span className="size-1 shrink-0 rounded-full bg-ink-500" />
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="size-3" /> {formatDuration(movie.durationMinutes)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MovieCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[2/3] rounded-2xl" />
      <Skeleton className="mt-3 h-4 w-3/4 rounded-md" />
      <Skeleton className="mt-2 h-3 w-1/2 rounded-md" />
    </div>
  );
}

export const movieGridClass = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
