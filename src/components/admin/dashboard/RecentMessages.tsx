"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRecentMessage } from "@/hooks/use-dashboard-stats";
import { timeAgo } from "@/lib/time-ago";
import { Mail } from "lucide-react";
import Link from "next/link";

type RecentMessagesProps = {
  messages: DashboardRecentMessage[];
  totalUnread: number;
};

export function RecentMessages({ messages, totalUnread }: RecentMessagesProps) {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Unread Messages</CardTitle>
        {totalUnread > 0 && (
          <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground tabular-nums">
            {totalUnread}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unread messages.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Link
                key={msg.id}
                href="/admin/messages"
                className="flex items-start gap-3 rounded-md p-2 hover:bg-muted"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{msg.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{msg.subject}</p>
                </div>
              </Link>
            ))}
            <Link
              href="/admin/messages"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              View all messages &rarr;
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
