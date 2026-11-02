import { Popcorn } from "lucide-react";
import { Container, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="grid min-h-[65vh] place-items-center text-center">
      <div className="animate-fade-up">
        <Popcorn className="mx-auto size-14 text-brand-400" />
        <p className="mt-4 text-7xl font-black tracking-tighter text-white">404</p>
        <p className="mt-2 text-ink-400">Trang bạn tìm đã &quot;hết suất chiếu&quot;.</p>
        <LinkButton href="/" className="mt-6">
          Về trang chủ
        </LinkButton>
      </div>
    </Container>
  );
}
