"use client";

import { useState } from "react";
import clsx from "clsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Undo2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/notify";
import { useRefunds } from "@/lib/queries";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { RefundDto } from "@/lib/types";
import { Button, ConfirmDialog, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { Pager } from "../reservations/admin-reservations-view";

const tabs = [
  { status: "RefundRequired", label: "Cần hoàn" },
  { status: "Refunded", label: "Đã hoàn" },
] as const;

// Lý do phải hoàn suy từ trạng thái đơn: huỷ sau khi trả, hoặc VNPay trừ tiền khi đơn đã hết hạn
const reason = (r: RefundDto) => (r.reservationStatus === "Cancelled" ? "Huỷ vé đã thanh toán" : "Trả tiền sau khi đơn hết hạn");

export function AdminRefundsView() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<(typeof tabs)[number]["status"]>("RefundRequired");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<RefundDto | null>(null);
  const { data, isPending, error, refetch, isFetching } = useRefunds(status, page);

  const mark = useMutation({
    mutationFn: (r: RefundDto) => api<void>(`/api/admin/refunds/${r.paymentId}/refunded`, { method: "POST" }),
    onSuccess: (_, r) => {
      toast.success(`Đã ghi nhận hoàn ${formatMoney(r.amount)} cho đơn #${r.reservationId}`);
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      setTarget(null);
    },
    onError: (e) => {
      toast.error(e.message);
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex w-fit rounded-xl bg-ink-800 p-1">
        {tabs.map((t) => (
          <button
            key={t.status}
            onClick={() => {
              setStatus(t.status);
              setPage(1);
            }}
            className={clsx(
              "h-9 rounded-lg px-4 text-sm font-medium transition",
              status === t.status ? "bg-brand-500 text-white shadow" : "text-ink-400 hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-72" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={status === "RefundRequired" ? <CircleCheck className="size-6" /> : <Undo2 className="size-6" />}
          title={status === "RefundRequired" ? "Không có khoản nào cần hoàn" : "Chưa hoàn khoản nào"}
        />
      ) : (
        <div className={clsx("space-y-4 transition-opacity", isFetching && "opacity-70")}>
          <div className="overflow-x-auto rounded-2xl border border-ink-700">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-ink-850 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3">Đơn · Lý do</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Phim · Suất</th>
                  <th className="px-4 py-3">Mã giao dịch</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-right">{status === "RefundRequired" ? "Thao tác" : "Đã hoàn lúc"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {data.items.map((r) => (
                  <tr key={r.paymentId} className="hover:bg-ink-850/60">
                    <td className="px-4 py-3">
                      <p className="font-bold text-white">#{r.reservationId}</p>
                      <p className="text-xs text-ink-500">{reason(r)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-100">{r.userFullName}</p>
                      <p className="text-xs text-ink-500">{r.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-100">{r.movieTitle}</p>
                      <p className="text-xs text-ink-500">{formatDateTime(r.startAt)}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-300">
                      <p>VNPay: {r.providerTransactionNo ?? "—"}</p>
                      <p className="text-ink-500">TxnRef: {r.txnRef.slice(0, 12)}…</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gold-400">{formatMoney(r.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {status === "RefundRequired" ? (
                        <Button size="sm" variant="outline" onClick={() => setTarget(r)}>
                          Đã hoàn
                        </Button>
                      ) : (
                        <span className="text-ink-300">{r.refundedAt ? formatDateTime(r.refundedAt) : "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={() => target && mark.mutate(target)}
        loading={mark.isPending}
        title="Xác nhận đã hoàn tiền?"
        confirmLabel="Đã hoàn xong"
        description={
          target && (
            <>
              Chỉ bấm sau khi đã hoàn <b className="text-white">{formatMoney(target.amount)}</b> cho{" "}
              <b className="text-white">{target.userEmail}</b> trên cổng VNPay (mã giao dịch {target.providerTransactionNo ?? "—"}). Hệ thống
              chỉ ghi nhận, không tự chuyển tiền.
            </>
          )
        }
      />
    </div>
  );
}
