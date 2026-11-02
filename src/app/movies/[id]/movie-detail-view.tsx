"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, CalendarX2, Clock, Film, Tag, Users } from "lucide-react";
import { useMovie, useShowtimesByDate } from "@/lib/queries";
import { useToday } from "@/lib/hooks";
import { ageRating, formatDuration } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { Poster, posterGradient } from "@/components/poster";
import { DateStrip } from "@/components/date-strip";
import { ShowtimeChips } from "@/components/showtime-chips";
import { Container, EmptyState, ErrorState, LinkButton, Skeleton } from "@/components/ui";

export function MovieDetailView({ id }: { id: number }) {
  const { data: movie, isPending, error, refetch } = useMovie(id);
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked ?? today;
  const showtimes = useShowtimesByDate(day);

  if (error) {
    return (
      <Container className="pt-16">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            icon={<Film className="size-6" />}
            title="Không tìm thấy phim"
            description="Phim này không tồn tại hoặc đã ngừng chiếu."
            action={<LinkButton href="/movies">Xem phim khác</LinkButton>}
          />
        ) : (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        )}
      </Container>
    );
  }

  if (isPending) {
    return (
      <Container className="pt-8">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <Skeleton className="aspect-[2/3] w-48 md:w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Container>
    );
  }

  const rating = ageRating(movie.suitableAge);
  const mine = (showtimes.data ?? []).filter((s) => s.movieId === movie.id);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 blur-3xl" style={{ background: posterGradient(movie.title) }} />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/30 via-ink-950/70 to-ink-950" />
        <Container className="relative pb-10 pt-6">
          <Link href="/movies" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white">
            <ArrowLeft className="size-4" /> Danh sách phim
          </Link>
          <div className="mt-6 grid animate-fade-up gap-6 sm:grid-cols-[180px_1fr] md:grid-cols-[240px_1fr] md:gap-10">
            <Poster
              title={movie.title}
              posterUrl={movie.posterUrl}
              genre={movie.genre}
              suitableAge={movie.suitableAge}
              className="w-40 shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:w-full"
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{movie.title}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip icon={<Tag className="size-3.5" />}>{movie.genre}</Chip>
                <Chip icon={<Clock className="size-3.5" />}>{formatDuration(movie.durationMinutes)}</Chip>
                <Chip icon={<Users className="size-3.5" />}>
                  <span className={clsx("mr-1 rounded px-1 text-[10px] font-black", rating.className)}>{rating.label}</span>
                  {movie.suitableAge > 0 ? `Từ ${movie.suitableAge} tuổi` : "Mọi lứa tuổi"}
                </Chip>
              </div>
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Nội dung phim</h2>
                <p className="mt-2 max-w-3xl leading-relaxed text-ink-300">{movie.description || "Chưa có mô tả cho phim này."}</p>
              </div>
              <a href="#lich-chieu" className="mt-6 inline-flex md:hidden">
                <span className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25">Chọn suất chiếu</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <section id="lich-chieu" className="scroll-mt-20 rounded-3xl border border-ink-700 bg-ink-900/70 p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-extrabold text-white">Lịch chiếu</h2>
          <DateStrip today={today} value={day} onChange={setPicked} />
          <div className="mt-6 min-h-32">
            {showtimes.isPending || !day ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-24" />
                ))}
              </div>
            ) : showtimes.error ? (
              <ErrorState message={showtimes.error.message} onRetry={() => showtimes.refetch()} />
            ) : mine.length === 0 ? (
              <EmptyState
                icon={<CalendarX2 className="size-6" />}
                title="Không có suất chiếu trong ngày này"
                description="Hãy chọn ngày khác trên dải lịch phía trên."
              />
            ) : (
              <div key={day} className="animate-fade-in">
                <ShowtimeChips showtimes={mine} />
              </div>
            )}
          </div>
        </section>
      </Container>
    </>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm text-ink-300 ring-1 ring-white/10 backdrop-blur">
      {icon}
      {children}
    </span>
  );
}
