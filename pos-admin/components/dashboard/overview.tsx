"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  CreditCard,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────
type TableData = {
  id: string;
  number: number;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING";
  currentOrderId: string | null;
  currentOrder?: {
    id: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
  } | null;
};

type DailyReport = {
  sales: {
    totalRevenue: number;
    totalTransactions: number;
  };
};

type KitchenOrders = {
  pending: Array<{ id: string; isDelayed: boolean }>;
  completed: Array<{ id: string }>;
};

// ── Fetchers ───────────────────────────────────────────────────────
async function fetchTables(): Promise<TableData[]> {
  const res = await fetch("/api/admin/tables");
  if (!res.ok) throw new Error("Failed to fetch tables");
  const data = await res.json();
  return data.tables;
}

async function fetchDailyReport(): Promise<DailyReport> {
  const res = await fetch("/api/reports/daily");
  if (!res.ok) throw new Error("Failed to fetch report");
  return res.json();
}

async function fetchKitchenOrders(): Promise<KitchenOrders> {
  const res = await fetch("/api/kitchen/orders");
  if (!res.ok) throw new Error("Failed to fetch kitchen orders");
  return res.json();
}

// ── Component ──────────────────────────────────────────────────────
export function OverviewDashboard() {
  const tables = useQuery({ queryKey: ["tables"], queryFn: fetchTables });
  const report = useQuery({ queryKey: ["dashboard", "report"], queryFn: fetchDailyReport });
  const kitchen = useQuery({ queryKey: ["dashboard", "kitchen"], queryFn: fetchKitchenOrders });

  // Compute quick stats
  const activeOrders = (kitchen.data?.pending?.length ?? 0);
  const pendingPayments = Array.isArray(tables.data) 
    ? tables.data.filter(t => t.currentOrder?.paymentStatus === "PENDING_CONFIRMATION").length 
    : 0;
  const delayedOrders = kitchen.data?.pending?.filter(o => o.isDelayed).length ?? 0;
  const todayRevenue = report.data?.sales?.totalRevenue ?? 0;

  const stats = [
    {
      title: "Active Orders",
      value: activeOrders,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending Payments",
      value: pendingPayments,
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      title: "Delayed Orders",
      value: delayedOrders,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-500/10",
    },
    {
      title: "Today's Revenue",
      value: `$${todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden glass-card border-t-0 hover-lift group">
            <div className={`absolute top-0 left-0 w-full h-1 ${stat.bg.replace('/10', '/50')}`} />
            <CardContent className="p-5">
              {kitchen.isLoading || report.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                  </div>
                  <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                    <stat.icon className={cn("size-6", stat.color)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Grid */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/10 bg-white/40 dark:bg-slate-900/40">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Table Overview
            <Badge variant="outline" className="font-normal text-xs ml-2 rounded-full border-primary/20 bg-primary/5 text-primary">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {tables.isLoading ? (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {(Array.isArray(tables.data) ? tables.data : []).map((table) => {
                const paymentPending = table.currentOrder?.paymentStatus === "PENDING_CONFIRMATION";

                let statusColor = "bg-emerald-500/15 border-emerald-500/30 text-emerald-700";
                let statusLabel = "Available";
                let dotColor = "bg-emerald-500";

                if (table.status === "OCCUPIED") {
                  if (paymentPending) {
                    statusColor = "bg-amber-500/15 border-amber-500/30 text-amber-700";
                    statusLabel = "Payment";
                    dotColor = "bg-amber-500 animate-pulse";
                  } else {
                    statusColor = "bg-red-500/15 border-red-500/30 text-red-700";
                    statusLabel = "Occupied";
                    dotColor = "bg-red-500";
                  }
                } else if (table.status === "CLEANING") {
                  statusColor = "bg-sky-500/15 border-sky-500/30 text-sky-700";
                  statusLabel = "Cleaning";
                  dotColor = "bg-sky-500";
                }

                return (
                  <div
                    key={table.id}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer overflow-hidden group",
                      statusColor,
                    )}
                  >
                    {/* Background Glow */}
                    <div className={cn("absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity", dotColor.replace('bg-', 'bg-gradient-to-tr from-transparent to-'))} />

                    {/* Status dot */}
                    <span
                      className={cn("absolute top-3 right-3 size-2.5 rounded-full shadow-sm", dotColor)}
                    />

                    <span className="text-3xl font-black relative z-10">{table.number}</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest mt-2 relative z-10 opacity-90">
                      {statusLabel}
                    </span>

                    {table.currentOrder && (
                      <Badge variant="secondary" className="mt-3 text-xs px-2 py-0.5 bg-background/80 backdrop-blur-sm relative z-10 font-bold border-none shadow-sm">
                        ${Number(table.currentOrder.totalAmount).toFixed(0)}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            {[
              { color: "bg-emerald-500", label: "Available" },
              { color: "bg-red-500", label: "Occupied" },
              { color: "bg-amber-500", label: "Payment Pending" },
              { color: "bg-sky-500", label: "Cleaning" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", item.color)} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
