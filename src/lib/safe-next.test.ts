import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

// Kiểm cả kết quả lẫn "trình duyệt sẽ thật sự đi đâu": resolve kết quả theo trang login thật như router làm.
const SITE = "https://cineviet.vn";
const landsOnSite = (next: string) => new URL(next, `${SITE}/login`).origin === SITE;

describe("safeNext — đường dẫn nội bộ hợp lệ được giữ nguyên", () => {
  it.each([
    ["/", "/"],
    ["/orders", "/orders"],
    ["/profile", "/profile"],
    ["/tickets/42", "/tickets/42"],
    ["/booking/7?seats=1,2", "/booking/7?seats=1,2"],
    ["/movies?genre=Drama&page=2#lich-chieu", "/movies?genre=Drama&page=2#lich-chieu"],
    ["/admin/users#top", "/admin/users#top"],
    ["/phim/%C4%91%E1%BA%B9p", "/phim/%C4%91%E1%BA%B9p"], // ký tự đã mã hoá giữ nguyên
  ])("%s → %s", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it("chuẩn hoá ./ và ../ nhưng vẫn ở trong site", () => {
    expect(safeNext("/a/./b/../c")).toBe("/a/c");
  });
});

describe("safeNext — mọi thứ có thể đưa sang site khác đều về fallback", () => {
  it.each([
    // thiếu / rỗng
    [null],
    [undefined],
    [""],
    // URL tuyệt đối và scheme nguy hiểm
    ["https://evil.com"],
    ["http://evil.com/login"],
    ["javascript:alert(1)"],
    ["JaVaScRiPt:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["mailto:a@b.c"],
    // không bắt đầu bằng /
    ["evil.com"],
    [" /orders"],
    ["%2F%2Fevil.com"],
    // protocol-relative
    ["//evil.com"],
    ["///evil.com"],
    // dấu \ (trình duyệt đổi thành /)
    [String.raw`\evil.com`],
    [String.raw`/\evil.com`],
    [String.raw`/\/evil.com`],
    [String.raw`\\evil.com`],
    // ký tự điều khiển (trình duyệt bỏ đi → còn lại //evil.com)
    ["/\t/evil.com"],
    ["/\n/evil.com"],
    ["/\r/evil.com"],
    ["/\u0000/evil.com"],
    // chuẩn hoá đường dẫn sinh ra // ở đầu
    ["/.//evil.com"],
    ["/..//evil.com"],
    ["/./../..//evil.com"],
    // userinfo / host lạ
    ["//user@evil.com"],
  ])("%j → /", (input) => {
    expect(safeNext(input)).toBe("/");
  });

  it("fallback tuỳ chọn được dùng khi bị từ chối", () => {
    expect(safeNext("https://evil.com", "/home")).toBe("/home");
    expect(safeNext("/orders", "/home")).toBe("/orders");
  });
});

describe("safeNext — bất biến: kết quả luôn ở lại site", () => {
  const inputs = [
    "/orders", "//evil.com", String.raw`/\evil.com`, "/\t/evil.com", "/.//evil.com", "https://evil.com",
    "javascript:alert(1)", "/%2F%2Fevil.com", "/%5Cevil.com", "/@evil.com", "/a?next=//evil.com", "/#//evil.com",
  ];
  it.each(inputs)("%j", (input) => {
    expect(landsOnSite(safeNext(input))).toBe(true);
  });
});
