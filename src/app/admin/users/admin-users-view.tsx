"use client";

import { useState } from "react";
import clsx from "clsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { Search, ShieldCheck, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useUsers } from "@/lib/queries";
import { useSession } from "@/lib/hooks";
import type { Role, UserDto } from "@/lib/types";
import { Button, ConfirmDialog, EmptyState, ErrorState, inputClass, Skeleton } from "@/components/ui";
import { Pager } from "../reservations/admin-reservations-view";

export function AdminUsersView() {
  const queryClient = useQueryClient();
  const session = useSession();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ user: UserDto; role: Role } | null>(null);
  const { data, isPending, error, refetch, isFetching } = useUsers(search, page);

  const change = useMutation({
    mutationFn: ({ user, role }: { user: UserDto; role: Role }) =>
      api<void>(`/api/users/${user.id}/role`, { method: "PUT", body: { role } }),
    onSuccess: (_, { user, role }) => {
      toast.success(`${user.email} giờ là ${role}. Có hiệu lực khi họ đăng nhập lại (tối đa 15 phút).`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <form
        className="flex gap-2 rounded-2xl border border-ink-700 bg-ink-900/70 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(input.trim());
          setPage(1);
        }}
      >
        <input className={inputClass} placeholder="Tìm theo email hoặc họ tên" value={input} onChange={(e) => setInput(e.target.value)} />
        <Button type="submit" variant="secondary" aria-label="Tìm">
          <Search className="size-4" />
        </Button>
      </form>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-72" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Users className="size-6" />} title="Không tìm thấy user nào" />
      ) : (
        <div className={clsx("space-y-4 transition-opacity", isFetching && "opacity-70")}>
          <div className="overflow-x-auto rounded-2xl border border-ink-700">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-ink-850 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Quyền</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {data.items.map((u) => {
                  const isMe = session?.user.id === u.id;
                  const next: Role = u.role === "Admin" ? "Customer" : "Admin";
                  // Chỉ để ẩn nút — BE vẫn tự kiểm 3 luật (Owner bất khả xâm phạm, chỉ Owner hạ Admin)
                  const allowed = !u.isOwner && (next === "Admin" || !!session?.user.isOwner);
                  return (
                    <tr key={u.id} className="hover:bg-ink-850/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{u.fullName}</p>
                        <p className="text-xs text-ink-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {u.role === "Admin" ? (
                          <span className="inline-flex items-center gap-1 text-gold-300">
                            <ShieldCheck className="size-4" /> {u.isOwner ? "Owner" : "Admin"}
                          </span>
                        ) : (
                          <span className="text-ink-300">Customer</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMe ? (
                          <span className="text-xs text-ink-500">Bạn</span>
                        ) : !allowed ? (
                          <span className="text-xs text-ink-500">{u.isOwner ? "Không đổi được" : "Chỉ Owner hạ được"}</span>
                        ) : (
                          <Button size="sm" variant={next === "Admin" ? "outline" : "danger"} onClick={() => setTarget({ user: u, role: next })}>
                            {next === "Admin" ? "Nâng lên Admin" : "Hạ về Customer"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={() => target && change.mutate(target)}
        loading={change.isPending}
        title={target?.role === "Admin" ? "Nâng quyền Admin?" : "Hạ quyền về Customer?"}
        confirmLabel="Xác nhận"
        description={
          target && (
            <>
              <b className="text-white">{target.user.email}</b>{" "}
              {target.role === "Admin" ? "sẽ quản lý được phim, suất chiếu, báo cáo và quyền của người khác." : "sẽ mất quyền quản trị."} Thay đổi có hiệu lực
              khi họ đăng nhập lại hoặc token tự làm mới (tối đa 15 phút).
            </>
          )
        }
      />
    </div>
  );
}
