"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Users, Clock, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderDetailModal } from "./order-detail-modal";

interface TableData {
  id: string;
  number: number;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING";
  currentOrderId: string | null;
  currentOrder: {
    id: string;
    status: string;
    paymentStatus: string;
    totalAmount: string;
    createdAt?: string; // We might need to fetch createdAt, let's see if it's there
  } | null;
}

export function TableGrid() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: tables = [], isLoading, error } = useQuery<TableData[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await fetch("/api/admin/tables");
      if (!res.ok) throw new Error("Failed to fetch tables");
      const data = await res.json();
      return data.tables;
    },
    refetchInterval: 10000, // Auto refresh every 10s
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
        Failed to load tables. Please try again.
      </div>
    );
  }



  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => {
          const isOccupied = table.status === "OCCUPIED";
          
          return (
            <Card 
              key={table.id}
              className={`relative overflow-hidden glass-card transition-all duration-300 cursor-pointer hover-lift group ${
                table.status === 'AVAILABLE' ? 'border-t-4 border-t-emerald-500' :
                table.status === 'OCCUPIED' ? 'border-t-4 border-t-amber-500' :
                'border-t-4 border-t-blue-500'
              }`}
              onClick={() => {
                if (table.currentOrderId) {
                  setSelectedOrderId(table.currentOrderId);
                }
              }}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                table.status === 'AVAILABLE' ? 'bg-gradient-to-br from-emerald-500 to-transparent' :
                table.status === 'OCCUPIED' ? 'bg-gradient-to-br from-amber-500 to-transparent' :
                'bg-gradient-to-br from-blue-500 to-transparent'
              }`} />

              <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-3xl font-black flex items-center gap-2">
                  <span className="text-muted-foreground/50 text-xl font-bold">#</span>{table.number}
                </CardTitle>
                <Badge className={`
                  font-bold uppercase tracking-widest text-[10px] px-2 py-0.5
                  ${table.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20' : ''}
                  ${table.status === 'OCCUPIED' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20' : ''}
                  ${table.status === 'CLEANING' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20' : ''}
                `} variant="outline" style={{ border: 'none' }}>
                  {table.status}
                </Badge>
              </CardHeader>
              <CardContent className="px-5 pb-5 relative z-10">
                <div className="flex items-center text-xs font-semibold text-muted-foreground mb-4">
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Capacity: {table.capacity}
                </div>
                
                {isOccupied && table.currentOrder ? (
                  <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center text-xs font-medium text-muted-foreground"><Receipt className="w-3.5 h-3.5 mr-1.5" /> Total</span>
                      <span className="text-lg font-black">${Number(table.currentOrder.totalAmount).toFixed(2)}</span>
                    </div>
                    {table.currentOrder.paymentStatus !== "PENDING" && (
                      <div className="flex justify-between items-center pt-2">
                         <span className="text-xs font-medium text-muted-foreground">Payment</span>
                         <Badge variant="secondary" className="text-[10px] px-1.5 bg-slate-100 dark:bg-slate-800">{table.currentOrder.paymentStatus.replace('_', ' ')}</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center h-[60px]">
                    <span className="text-muted-foreground/60 text-sm font-medium">
                      {table.status === "AVAILABLE" ? "Ready for guests" : "Needs attention"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <OrderDetailModal 
        orderId={selectedOrderId} 
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)} 
      />
    </>
  );
}
