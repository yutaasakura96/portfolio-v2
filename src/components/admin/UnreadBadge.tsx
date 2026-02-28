"use client";

import { useUnreadCount } from "@/hooks/use-messages";

export function UnreadBadge() {
  const { data: count } = useUnreadCount();

  if (!count) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
