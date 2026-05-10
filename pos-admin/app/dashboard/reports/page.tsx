import { Metadata } from "next";
import { BarChart3, TrendingUp, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reports | FutureLink POS",
  description: "View restaurant performance reports",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gradient">Reports</h1>
          <p className="text-muted-foreground font-medium mt-1">
            Track your restaurant performance and analytics.
          </p>
        </div>
        <Button className="font-bold shadow-lg shadow-primary/20">
          <Download className="size-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Sales Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">+12.5%</div>
            <p className="text-xs text-muted-foreground mt-1">Compared to last month</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="size-4 text-blue-500" />
              Avg. Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">$42.50</div>
            <p className="text-xs text-muted-foreground mt-1">Based on 1.2k orders</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="size-4 text-purple-500" />
              Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">7 PM - 9 PM</div>
            <p className="text-xs text-muted-foreground mt-1">Highest customer volume</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card min-h-[400px] flex items-center justify-center border-dashed">
        <div className="text-center space-y-4">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BarChart3 className="size-8 text-primary opacity-50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">No Detailed Reports Yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Analytics will appear here once more transaction data is collected.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
