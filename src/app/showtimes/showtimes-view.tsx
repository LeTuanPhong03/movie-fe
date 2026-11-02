"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarX2, Clock } from "lucide-react";
import { useMovieLookup, useShowtimesByDate } from "@/lib/queries";
import { useToday } from "@/lib/hooks";
import { formatDuration, formatWeekday, addDays } from "@/lib/format";
import type { ShowtimeDto } from "@/lib/types";
import { Poster } from "@/components/poster";
import { DateStrip } from "@/components/date-strip";
import { ShowtimeChips } from "@/components/showtime-chips";
import { Container, EmptyState, ErrorState, Skeleton } from "@/components/ui";

export function ShowtimesView() {
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const day = picked ?? today;
  const { data, isPending, error, refetch } = useShowtimesByDate(day);
  const lookup = useMovieLookup();

  // Gom suất theo MovieId (tên có thể trùng); giữ thứ tự xuất hiện: phim có suất sớm nhất lên đầu
  const byMovie = new Map<number, ShowtimeDto[]>();
  for (const s of data ?? []) byMovie.set(s.movieId, [...(byMovie.get(s.movieId) ?? []), s]);

  return (
    <Container className="pt-8">
      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Lịch chiếu</h1>
      <p className="mt-1.5 text-sm text-ink-400">
        {day ? `${formatWeekday(`${day}T05:00:00Z`)}, ${day.split("-").reverse().join("/")}` : "…"} · Giờ Việt Nam
      </p>

      <div className="sticky top-16 z-20 -mx-4 mt-6 border-b border-ink-800 bg-ink-950/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
        <DateStrip today={today} value={day} onChange={setPicked} />
      </div>

      <div className="mt-6 space-y-4">
        {error ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : isPending || !day ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)
        ) : byMovie.size === 0 ? (
          <EmptyState
            icon={<CalendarX2 className="size-6" />}
            title="Không còn suất chiếu trong ngày"
            description={today && day === today ? "Các suất hôm nay đã bắt đầu. Xem lịch ngày mai nhé!" : "Hãy chọn ngày khác."}
            action={
              today && day === today ? (
                <button onClick={() => setPicked(addDays(today, 1))} className="text-sm font-semibold text-brand-300 hover:text-brand-400">
                  Xem ngày mai →
                </button>
              ) : undefined
            }
          />
        ) : (
          [...byMovie.entries()].map(([movieId, list], i) => {
            const movie = lookup.get(movieId);
            const title = list[0].title;
            return (
              <article
                key={`${day}-${movieId}`}
                className="grid animate-fade-up gap-4 rounded-3xl border border-ink-700 bg-ink-900/70 p-4 sm:grid-cols-[120px_1fr] sm:gap-6 sm:p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Link href={`/movies/${movieId}`} className="flex gap-4 sm:block">
                  <Poster
                    title={title}
                    posterUrl={movie?.posterUrl}
                    genre={movie?.genre}
                    suitableAge={movie?.suitableAge}
                    className="w-20 shrink-0 sm:w-full"
                  />
                  <div className="sm:hidden">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                    {movie && <MovieMeta genre={movie.genre} duration={movie.durationMinutes} />}
                  </div>
                </Link>
                <div>
                  <div className="mb-4 hidden sm:block">
                    <Link href={`/movies/${movieId}`} className="text-xl font-bold text-white hover:text-brand-300">
                      {title}
                    </Link>
                    {movie && <MovieMeta genre={movie.genre} duration={movie.durationMinutes} />}
                  </div>
                  <ShowtimeChips showtimes={list} />
                </div>
              </article>
            );
          })
        )}
      </div>
    </Container>
  );
}

function MovieMeta({ genre, duration }: { genre: string; duration: number }) {
  return (
    <p className="mt-1 flex items-center gap-2 text-sm text-ink-400">
      {genre}
      <span className="size-1 rounded-full bg-ink-500" />
      <Clock className="size-3.5" /> {formatDuration(duration)}
    </p>
  );
}
