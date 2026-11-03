"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuthReady, useSession } from "@/lib/hooks";
import { Container, EmptyState, LinkButton, Spinner } from "./ui";

/**
 * Chặn trang cần đăng nhập ở phía FE (chỉ để trải nghiệm mượt). Bảo mật thật nằm ở BE: không có token thì API trả 401,
 * sai role thì 403 — FE có bị sửa cũng không đọc được dữ liệu của người khác.
 */
export function RequireAuth({ children, role }: { children: ReactNode; role?: "Admin" }) {
  const session = useSession();
  // Chờ khôi phục phiên (F5 → /refresh) xong mới quyết định, không thì người đã đăng nhập bị đá sang /login
  const ready = useAuthReady();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, session, router, pathname]);

  if (!ready || !session) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (role && session.user.role !== role) {
    return (
      <Container className="pt-16">
        <EmptyState
          icon={<ShieldAlert className="size-6" />}
          title="Bạn không có quyền vào trang này"
          description="Trang này chỉ dành cho quản trị viên."
          action={<LinkButton href="/">Về trang chủ</LinkButton>}
        />
      </Container>
    );
  }

  return <>{children}</>;
}
