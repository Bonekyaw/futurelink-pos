"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 4) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, clientType: "web" }),
      });

      if (!res.ok) {
        throw new Error("Invalid PIN");
      }

      toast.success("Login successful");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("Authentication failed", {
        description: "Please check your PIN and try again.",
      });
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
      <Card className="w-full max-w-sm shadow-xl border-none bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <ChefHat className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">FutureLink POS</CardTitle>
          <CardDescription>Enter your admin PIN to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`size-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-200 ${
                    pin.length > i 
                      ? "border-primary bg-primary/5 text-primary shadow-sm" 
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {pin[i] ? "●" : ""}
                </div>
              ))}
            </div>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              autoFocus
              className="sr-only"
              disabled={loading}
            />
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "←"].map((num) => (
                <Button
                  key={num.toString()}
                  type="button"
                  variant="outline"
                  className="h-16 text-xl font-semibold rounded-2xl border-slate-200 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                  onClick={() => {
                    if (num === "C") setPin("");
                    else if (num === "←") setPin(pin.slice(0, -1));
                    else if (pin.length < 4) setPin(pin + num.toString());
                  }}
                  disabled={loading}
                >
                  {num}
                </Button>
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
              disabled={pin.length !== 4 || loading}
            >
              {loading ? <Loader2 className="animate-spin size-6" /> : "Unlock Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
