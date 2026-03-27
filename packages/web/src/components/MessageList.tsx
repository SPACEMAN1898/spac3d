import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatDate } from "@clinikchat/shared";
import type { Message, User } from "@clinikchat/shared";

export interface MessageRow {
  message: Message;
  showHeader: boolean;
}

export interface DateRow {
  kind: "date";
  id: string;
  label: string;
}

export type VirtualRow = DateRow | ({ kind: "message" } & MessageRow);

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function buildRows(messages: Message[]): VirtualRow[] {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const rows: VirtualRow[] = [];
  let prev: Message | undefined;
  for (const m of sorted) {
    const t = new Date(m.createdAt);
    const day = startOfDay(t);
    const prevDay = prev ? startOfDay(new Date(prev.createdAt)) : null;
    if (prevDay === null || day !== prevDay) {
      rows.push({
        kind: "date",
        id: `d-${day}`,
        label: t.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
      });
    }
    const prevTime = prev ? new Date(prev.createdAt).getTime() : 0;
    const sameAuthor = prev?.authorId === m.authorId;
    const within5m = prev && sameAuthor && t.getTime() - prevTime < 5 * 60 * 1000;
    rows.push({
      kind: "message",
      message: m,
      showHeader: !within5m,
    });
    prev = m;
  }
  return rows;
}

function Avatar({ user }: { user: User | undefined }) {
  const letter = (user?.displayName ?? "?").slice(0, 1).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
      {letter}
    </div>
  );
}

export function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => buildRows(messages), [messages]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index]?.kind === "date" ? 36 : 72),
    overscan: 12,
  });

  useEffect(() => {
    virtualizer.scrollToIndex(rows.length - 1, { align: "end" });
  }, [rows.length, virtualizer, messages]);

  return (
    <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const row = rows[vi.index];
          if (!row) return null;
          if (row.kind === "date") {
            return (
              <div
                key={row.id}
                className="absolute left-0 right-0 top-0 flex justify-center py-2"
                style={{ transform: `translateY(${vi.start}px)` }}
              >
                <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-medium text-slate-600">
                  {row.label}
                </span>
              </div>
            );
          }
          const { message: m, showHeader } = row;
          const author = m.author;
          return (
            <div
              key={m.id}
              className="absolute left-0 right-0 top-0 flex gap-3 px-1"
              style={{ transform: `translateY(${vi.start}px)` }}
            >
              <div className="w-8 shrink-0 pt-0.5">{showHeader ? <Avatar user={author} /> : null}</div>
              <div className="min-w-0 flex-1 pb-2">
                {showHeader && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {author?.displayName ?? "Unknown"}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(m.createdAt)}</span>
                  </div>
                )}
                <p className={`text-sm text-slate-800 ${showHeader ? "mt-0.5" : ""}`}>
                  {m.deletedAt ? (
                    <span className="italic text-slate-400">Message deleted</span>
                  ) : (
                    m.content
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
