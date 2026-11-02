// Mọi hiển thị ngày giờ đều theo giờ Việt Nam, dù máy người dùng đặt múi giờ nào.
// Việt Nam không có giờ mùa hè → luôn UTC+7, nên đổi qua lại bằng hằng số +07:00 là an toàn.

export const VN_TZ = "Asia/Ho_Chi_Minh";

/** BE trả UTC; phòng trường hợp chuỗi thiếu "Z" thì tự thêm để trình duyệt không hiểu nhầm là giờ máy. */
export function parseUtc(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

const timeFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dateFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TZ, weekday: "long" });
const isoDateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: VN_TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const moneyFmt = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export const formatTime = (iso: string) => timeFmt.format(parseUtc(iso));
export const formatDate = (iso: string) => dateFmt.format(parseUtc(iso));
export const formatDateTime = (iso: string) => `${formatTime(iso)} · ${formatDate(iso)}`;
export const formatMoney = (value: number) => moneyFmt.format(value);

export function formatWeekday(iso: string) {
  const s = weekdayFmt.format(parseUtc(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} giờ ${m.toString().padStart(2, "0")} phút` : `${m} phút`;
}

/** Ngày "YYYY-MM-DD" theo giờ VN của một thời điểm — đúng định dạng DateOnly mà API ?date= cần. */
export const toVnDateString = (date: Date) => isoDateFmt.format(date);

/** Cộng ngày trên chuỗi "YYYY-MM-DD" (tính ở 12h trưa UTC để không bao giờ trượt sang ngày khác). */
export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Thông tin hiển thị cho một ngày "YYYY-MM-DD" (dùng ở dải chọn ngày). */
export function describeDay(day: string, today: string) {
  const d = new Date(`${day}T12:00:00Z`);
  const weekday = d.getUTCDay();
  const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  let label = labels[weekday];
  if (day === today) label = "Hôm nay";
  else if (day === addDays(today, 1)) label = "Ngày mai";
  return {
    label,
    dayOfMonth: d.getUTCDate().toString().padStart(2, "0"),
    month: (d.getUTCMonth() + 1).toString().padStart(2, "0"),
    isWeekend: weekday === 0 || weekday === 6,
  };
}

/** Giá trị ô <input type="datetime-local"> người dùng hiểu là giờ VN → ISO UTC có "Z" (validator BE bắt buộc). */
export function vnLocalInputToUtcIso(value: string) {
  return new Date(`${value}:00+07:00`).toISOString();
}

/** Nhãn phân loại độ tuổi kiểu rạp Việt Nam: P (mọi lứa tuổi), K, T13, T16, T18. */
export function ageRating(age: number) {
  if (age <= 0) return { label: "P", className: "bg-emerald-500 text-white" };
  if (age < 13) return { label: "K", className: "bg-sky-500 text-white" };
  if (age < 16) return { label: "T13", className: "bg-amber-400 text-black" };
  if (age < 18) return { label: "T16", className: "bg-orange-500 text-white" };
  return { label: "T18", className: "bg-red-600 text-white" };
}
