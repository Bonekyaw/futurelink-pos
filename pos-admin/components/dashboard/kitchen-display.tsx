"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderItem {
  id: string;
  quantity: number;
  status: string;
  notes?: string;
  isDelayed: boolean;
  preparationTime: number;
  menuItem: { name: string };
}

interface KitchenOrder {
  id: string;
  status: string;
  type: string;
  timeElapsedMinutes: number;
  isDelayed: boolean;
  table?: { number: number };
  items: OrderItem[];
}

export function KitchenDisplay() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ pending: KitchenOrder[], completed: KitchenOrder[] }>({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const res = await fetch("/api/kitchen/orders");
      if (!res.ok) throw new Error("Failed to fetch kitchen orders");
      return res.json();
    },
    refetchInterval: 30000, // Auto refresh every 30s as per requirement
  });

  const updateItemStatus = useMutation({
    mutationFn: async ({ orderId, itemId, status }: { orderId: string, itemId: string, status: string }) => {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingOrders = data?.pending || [];
  const readyOrders = data?.completed || [];

  const renderOrderCard = (order: KitchenOrder, isPendingView: boolean) => (
    <Card 
      key={order.id} 
      className={`mb-4 overflow-hidden border-l-4 transition-all duration-300 hover:shadow-md ${order.isDelayed && isPendingView ? 'border-l-red-500' : 'border-l-primary'}`}
    >
      <CardHeader className="py-3 px-5 bg-slate-50/80 dark:bg-slate-900/80 border-b flex flex-row items-center justify-between space-y-0 backdrop-blur-sm">
        <div>
          <CardTitle className="text-lg font-black flex items-center gap-2 tracking-tight">
            {order.table ? `Table ${order.table.number}` : 'Takeaway'}
            {order.isDelayed && isPendingView && (
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            )}
          </CardTitle>
          <div className="text-xs font-semibold text-muted-foreground mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {order.timeElapsedMinutes}m ago
          </div>
        </div>
        <Badge variant={isPendingView ? (order.isDelayed ? 'destructive' : 'secondary') : 'default'} className="font-bold tracking-widest px-2 shadow-sm">
          {order.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-0 bg-white/50 dark:bg-slate-950/50">
        <div className="divide-y">
          {order.items.map(item => (
            <div 
              key={item.id} 
              className={`p-4 flex items-center justify-between ${
                item.isDelayed && ['PENDING', 'COOKING'].includes(item.status) ? 'bg-red-50/50' : ''
              }`}
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-sm font-bold">
                    {item.quantity}x
                  </span>
                  {item.menuItem.name}
                  {item.isDelayed && ['PENDING', 'COOKING'].includes(item.status) && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">DELAYED</Badge>
                  )}
                </div>
                {item.notes && (
                  <div className="text-sm text-muted-foreground mt-1 ml-9">
                    Note: {item.notes}
                  </div>
                )}
              </div>

              {isPendingView ? (
                <div className="flex gap-2">
                  {item.status === 'PENDING' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold"
                      onClick={() => updateItemStatus.mutate({ orderId: order.id, itemId: item.id, status: 'COOKING' })}
                      disabled={updateItemStatus.isPending}
                    >
                      Start Cooking
                    </Button>
                  )}
                  {['PENDING', 'COOKING'].includes(item.status) && (
                    <Button 
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-500/20"
                      onClick={() => updateItemStatus.mutate({ orderId: order.id, itemId: item.id, status: 'READY' })}
                      disabled={updateItemStatus.isPending}
                    >
                      Mark Ready
                    </Button>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 font-bold">
                  {item.status}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      {/* Left Panel: Pending Orders */}
      <div className="flex flex-col h-full glass-card rounded-2xl border overflow-hidden shadow-lg">
        <div className="p-5 bg-gradient-to-r from-slate-100 to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 border-b font-black text-xl flex justify-between items-center backdrop-blur-md">
          <span className="text-gradient">Pending & Cooking</span>
          <Badge variant="secondary" className="px-3 py-1 text-sm shadow-sm">{pendingOrders.length}</Badge>
        </div>
        <ScrollArea className="flex-1 p-5 bg-slate-50/20 dark:bg-slate-900/20">
          {pendingOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-12 animate-fade-in">
              <CheckCircle className="w-16 h-16 mb-4 opacity-20 text-emerald-500" />
              <p className="font-semibold text-lg">No pending orders</p>
            </div>
          ) : (
            <div className="animate-slide-up">
              {pendingOrders.map(order => renderOrderCard(order, true))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel: Ready for Delivery */}
      <div className="flex flex-col h-full glass-card rounded-2xl border overflow-hidden shadow-lg border-emerald-500/20">
        <div className="p-5 bg-gradient-to-r from-emerald-100/80 to-emerald-50/50 dark:from-emerald-900/40 dark:to-emerald-900/20 border-b border-emerald-500/20 font-black text-xl text-emerald-800 dark:text-emerald-400 flex justify-between items-center backdrop-blur-md">
          <span>Ready for Delivery</span>
          <Badge className="bg-emerald-600 hover:bg-emerald-600 shadow-sm px-3 py-1 text-sm">{readyOrders.length}</Badge>
        </div>
        <ScrollArea className="flex-1 p-5 bg-slate-50/20 dark:bg-slate-900/20">
          {readyOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground pt-12 animate-fade-in">
              <p className="font-semibold text-lg opacity-50">No orders ready</p>
            </div>
          ) : (
            <div className="animate-slide-up">
              {readyOrders.map(order => renderOrderCard(order, false))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
