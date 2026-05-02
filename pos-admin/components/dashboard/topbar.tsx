"use client";

import { useEffect, useState } from "react";
import { Bell, Wifi, WifiOff, LogOut, User } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SERVER_EVENT_CHANNEL, type ServerEventPayload } from "@shared/socket-events";

export function Topbar({ userName }: { userName: string }) {
  const { socket, isConnected } = useSocket();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [pendingPayments, setPendingPayments] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Clock
  useEffect(() => {
    function tick() {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      {/* Left: time */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono text-muted-foreground tabular-nums">
          {currentTime}
        </span>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <Wifi className="size-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="size-3.5 text-destructive" />
          )}
          <span className="text-xs text-muted-foreground">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Right: notifications + user + logout */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {pendingPayments > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px] font-bold rounded-full"
            >
              {pendingPayments}
            </Badge>
          )}
        </Button>

        {/* User */}
        <div className="flex items-center gap-2 text-sm">
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="size-3.5 text-primary" />
          </div>
          <span className="font-medium hidden lg:inline">{userName}</span>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Logout"
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
