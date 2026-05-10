"use client";

import { useEffect, useState } from "react";
import { Bell, Wifi, WifiOff, LogOut, User } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SERVER_EVENT_CHANNEL, type ServerEventPayload } from "@shared/socket-events";
import { authClient } from "@/lib/auth-client";

export function Topbar({ userName }: { userName: string }) {
  const { socket, isConnected } = useSocket();
  const [pendingPayments, setPendingPayments] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();


  // Listen for realtime events to trigger refetches
  useEffect(() => {
    if (!socket) return;

    function handleEvent(payload: ServerEventPayload) {
      // Trigger refetches for relevant queries
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen"] });

      if (payload.type === "PAYMENT_REQUESTED") {
        setPendingPayments((prev) => prev + 1);
      }
      if (payload.type === "PAYMENT_CONFIRMED") {
        setPendingPayments((prev) => Math.max(0, prev - 1));
      }
    }

    socket.on(SERVER_EVENT_CHANNEL, handleEvent);
    return () => {
      socket.off(SERVER_EVENT_CHANNEL, handleEvent);
    };
  }, [socket, queryClient]);

  async function handleLogout() {
    await authClient.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between h-16 px-8 border-b border-white/10 glass sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300">
          {isConnected ? (
            <>
              <div className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Right: notifications + user + logout */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Notifications">
          <Bell className="size-5 text-slate-600 dark:text-slate-300" />
          {pendingPayments > 0 && (
            <Badge
              variant="destructive"
              className="absolute 1 top-0 right-0 size-5 p-0 flex items-center justify-center text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
            >
              {pendingPayments}
            </Badge>
          )}
        </Button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-violet-600 p-[2px] shadow-md shadow-primary/20">
            <div className="size-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
              <User className="size-4 text-primary" />
            </div>
          </div>
          <span className="font-bold text-sm hidden lg:inline tracking-tight">{userName}</span>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
          className="rounded-full text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 ml-2 transition-colors"
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    </header>
  );
}
