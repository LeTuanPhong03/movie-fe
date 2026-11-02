"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ShieldX, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { VnPayCallbackResult } from "@/lib/types";
import { Container, LinkButton, Spinner } from "@/components/ui";

/**
 * VNPay đưa trình duyệt về đây kèm các tham số vnp_* đã ký. FE KHÔNG tự tin các tham số này (người dùng sửa URL được):
 * chuyển nguyên query string sang BE /api/payments/vnpay/return, BE kiểm chữ ký HMAC rồi mới xác nhận đơn.
 * Gọi lại nhiều lần vẫn an toàn vì BE xử lý idempotent (lần sau nhận mã "02 đã xử lý").
 */
export function VnPayReturnView() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const qs = params.toString();
  const query = Object.fromEntries(params.entries());

  const result = useQuery({
    queryKey: ["vnpay-return", qs],
    queryFn: async () => {
      const r = await api<VnPayCallbackResult>("/api/payments/vnpay/return", { query, auth: false });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      if (r.reservationId) queryClient.invalidateQueries({ queryKey: ["reservation", r.reservationId] });
      return r;
    },
    enabled: qs.length > 0,
    retry: false,
    staleTime: Infinity,
  });

  const amount = Number(query.vnp_Amount ?? 0) / 100; // VNPay gửi số tiền × 100
  const userCancelled = query.vnp_ResponseCode === "24";

  if (!qs) {
    return <ResultCard tone="error" icon={<ShieldX />} title="Thiếu thông tin thanh toán" text="Trang này chỉ mở được khi VNPay chuyển về." />;
  }

  if (result.isPending) {
    return (
      <Container className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <Spinner className="mx-auto size-10" />
          <p className="mt-4 text-sm text-ink-400">Đang xác thực giao dịch với máy chủ…</p>
        </div>
      </Container>
    );
  }

  if (result.error) {
    return <ResultCard tone="error" icon={<XCircle />} title="Không xác thực được giao dịch" text={result.error.message} />;
  }

  const r = result.data;
  const ticketLink = r.reservationId ? `/tickets/${r.reservationId}` : "/tickets";

  if (r.rspCode === "97") {
    return <ResultCard tone="error" icon={<ShieldX />} title="Chữ ký không hợp lệ" text="Dữ liệu thanh toán đã bị thay đổi. Đơn của bạn không bị ảnh hưởng." />;
  }
  if (r.paymentStatus === "RefundRequired") {
    return (
      <ResultCard
        tone="warning"
        icon={<AlertTriangle />}
        title="Đã trừ tiền nhưng đơn đã hết hạn"
        text="Giao dịch thành công nhưng ghế không còn được giữ. Rạp sẽ hoàn tiền cho bạn, vui lòng liên hệ hỗ trợ."
        amount={amount}
        action={<LinkButton href={ticketLink} variant="outline">Xem đơn</LinkButton>}
      />
    );
  }
  // "00" + Succeeded: vừa xác nhận xong. "02": IPN đã xử lý trước đó → xem trạng thái thật ở trang vé.
  if (r.paymentStatus === "Succeeded" || (r.rspCode === "02" && query.vnp_ResponseCode === "00")) {
    return (
      <ResultCard
        tone="success"
        icon={<CheckCircle2 />}
        title="Thanh toán thành công!"
        text="Vé của bạn đã được xác nhận. Hãy xuất trình mã vé tại quầy hoặc cửa soát vé."
        amount={amount}
        action={<LinkButton href={ticketLink}>Xem vé của tôi</LinkButton>}
      />
    );
  }
  return (
    <ResultCard
      tone="error"
      icon={<XCircle />}
      title={userCancelled ? "Bạn đã huỷ thanh toán" : "Thanh toán không thành công"}
      text="Ghế vẫn được giữ đến hết thời gian giữ chỗ — bạn có thể thử thanh toán lại."
      action={
        r.reservationId ? (
          <LinkButton href={`/checkout/${r.reservationId}`}>Thử thanh toán lại</LinkButton>
        ) : (
          <LinkButton href="/tickets">Vé của tôi</LinkButton>
        )
      }
    />
  );
}

const toneClass = {
  success: { ring: "border-emerald-500/30", icon: "bg-emerald-500/15 text-emerald-400" },
  warning: { ring: "border-gold-500/30", icon: "bg-gold-500/15 text-gold-400" },
  error: { ring: "border-brand-500/30", icon: "bg-brand-500/15 text-brand-400" },
};

function ResultCard({
  tone,
  icon,
  title,
  text,
  amount,
  action,
}: {
  tone: keyof typeof toneClass;
  icon: React.ReactNode;
  title: string;
  text: string;
  amount?: number;
  action?: React.ReactNode;
}) {
  return (
    <Container className="grid min-h-[65vh] place-items-center py-10">
      <div className={`w-full max-w-md animate-fade-up rounded-3xl border bg-ink-900/80 p-8 text-center ${toneClass[tone].ring}`}>
        <div className={`mx-auto grid size-16 animate-pop place-items-center rounded-full [&>svg]:size-9 ${toneClass[tone].icon}`}>{icon}</div>
        <h1 className="mt-5 text-2xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{text}</p>
        {!!amount && <p className="mt-4 text-3xl font-black text-gold-400">{formatMoney(amount)}</p>}
        <div className="mt-7 flex flex-col gap-2">
          {action}
          <LinkButton href="/" variant="ghost">
            Về trang chủ
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
