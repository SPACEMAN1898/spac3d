const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return DATE_FORMATTER.format(d);
}

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < SIZE_UNITS.length - 1) {
    n /= 1024;
    u += 1;
  }
  const rounded = u === 0 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${rounded} ${SIZE_UNITS[u]}`;
}

export function truncateText(text: string, maxLength: number, ellipsis = "…"): string {
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  const sliceLen = Math.max(0, maxLength - ellipsis.length);
  return `${text.slice(0, sliceLen)}${ellipsis}`;
}
