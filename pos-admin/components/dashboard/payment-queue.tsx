"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Clock, User, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillPreviewModal } from "./bill-preview-modal";

interface PendingPayment {
  id: string;
  totalAmount: string;
  createdAt: string;
  table?: { number: number };
  waiter: { name: string };
  payments: {
    id: string;
    amount: string;
    method: string;
    createdAt: string;
  }[];
}

export function PaymentQueue() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ orders: PendingPayment[] }>({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) throw new Error("Failed to fetch pending payments");
      return res.json();
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 rounded-xl bg-red-50">
        Failed to load payment requests.
      </div>
    );
  }

  const orders = data?.orders || [];

  return (
    <>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500/50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">No pending payment requests right now.</p>
          </div>
        ) : (
          orders.map((order) => {
            const payment = order.payments[0]; // Assuming at least one pending payment exists
            return (
              <Card key={order.id} className="overflow-hidden glass-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-center justify-between p-5 sm:p-7 gap-5 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center gap-6 w-full sm:w-auto relative z-10">
                      <div className="flex flex-col items-center justify-center size-20 rounded-2xl bg-primary/10 text-primary shadow-inner border border-primary/10">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Table</span>
                        <span className="text-3xl font-black">{order.table?.number || '--'}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-black text-gradient">${Number(payment?.amount || order.totalAmount).toFixed(2)}</span>
                          <Badge variant="outline" className="bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-bold tracking-wide">
                            {payment?.method || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" /> {order.waiter.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {payment ? format(new Date(payment.createdAt), "h:mm a") : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto relative z-10">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto font-bold tracking-wide bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Review Bill
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <BillPreviewModal
        orderId={selectedOrderId}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </>
  );
}
