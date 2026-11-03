// Chống open redirect cho tham số ?next= của trang đăng nhập / đăng ký.
// Kẻ xấu gửi link /login?next=<trang lừa đảo>: người dùng đăng nhập thật trên site thật rồi bị đưa sang site giả
// (giả trang "đăng nhập lại", "nhập thẻ"...). Vì vậy chỉ cho quay về đường dẫn nội bộ, cùng origin.
//
// Không thể chỉ kiểm "bắt đầu bằng / và không bắt đầu bằng //": trình duyệt sửa URL trước khi đi —
// đổi "\" thành "/" và bỏ tab / xuống dòng — nên "/\evil.com" hay "/<tab>/evil.com" thành "//evil.com" = sang site khác.
// Cách chắc chắn: để chính bộ phân tích URL (giống trình duyệt) quyết định, rồi kiểm KẾT QUẢ.

// Origin giả để phân tích đường dẫn tương đối; chỉ cần là một origin cố định, không bao giờ được truy cập.
const BASE = "http://internal.invalid";

// Ký tự điều khiển (tab, xuống dòng, NUL...) và "\" — trình duyệt bỏ / đổi chúng nên không có lý do hợp lệ để xuất hiện
const SUSPICIOUS = /[\u0000-\u001F\u007F\\]/;

/** Trả về `next` nếu là đường dẫn nội bộ an toàn (giữ query + hash), ngược lại trả `fallback`. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || SUSPICIOUS.test(next)) return fallback;

  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return fallback;
  }
  // Còn ở origin giả = đường dẫn tương đối thật sự; khác origin = URL đã "thoát" ra site khác
  if (url.origin !== BASE) return fallback;

  const result = url.pathname + url.search + url.hash;
  // Chuẩn hoá có thể tự sinh ra "//" ở đầu (vd "/.//evil.com" → pathname "//evil.com"); trả chuỗi đó cho router
  // thì nó thành URL protocol-relative → sang site khác. Kiểm lần cuối trên chính chuỗi sẽ trả về.
  return result.startsWith("//") ? fallback : result;
}
