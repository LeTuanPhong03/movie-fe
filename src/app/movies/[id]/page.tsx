import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import { MovieDetailView } from "./movie-detail-view";

// Next 16: params là Promise. Giải nó trong Suspense để phần khung trang vẫn prerender được (cacheComponents).
export default function MovieDetailPage({ params }: PageProps<"/movies/[id]">) {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner className="size-8" /></div>}>
      {params.then(({ id }) => (
        <MovieDetailView id={Number(id)} />
      ))}
    </Suspense>
  );
}
