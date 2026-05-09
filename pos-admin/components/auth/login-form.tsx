"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

type Step = "email" | "otp";

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      toast.error("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: normalized,
        type: "sign-in",
      });
      if (error) {
        throw new Error(error.message ?? "Could not send code");
      }
      setEmail(normalized);
      setStep("otp");
      setOtp("");
      toast.success("Check your email", {
        description: "We sent a 6-digit code to your inbox.",
      });
    } catch {
      toast.error("Sign-in request failed", {
        description: "If this email is an admin address, you will receive a code shortly.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const { error: signError } = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      if (signError) {
        throw new Error(signError.message ?? "Invalid code");
      }

      const ex = await fetch("/api/auth/exchange-session", {
        method: "POST",
        credentials: "include",
      });
      if (!ex.ok) {
        throw new Error("Session exchange failed");
      }

      toast.success("Welcome back");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Verification failed", {
        description: "The code may be wrong or expired. Request a new one from the previous step.",
      });
      setOtp("");
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
          <CardTitle className="text-2xl font-bold tracking-tight">
            FutureLink POS
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your admin email to receive a sign-in code"
              : `Enter the 6-digit code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleSendEmail} className="space-y-6">
              <label className="block space-y-2 text-left">
                <span className="text-sm font-medium text-foreground">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@restaurant.com"
                  disabled={loading}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40"
                />
              </label>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <Loader2 className="animate-spin size-6" />
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`size-11 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                      otp.length > i
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {otp[i] ? otp[i] : ""}
                  </div>
                ))}
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="sr-only"
                disabled={loading}
              />

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "←"].map((num) => (
                  <Button
                    key={num.toString()}
                    type="button"
                    variant="outline"
                    className="h-12 text-lg font-semibold rounded-xl border-slate-200 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all active:scale-95"
                    onClick={() => {
                      if (num === "C") setOtp("");
                      else if (num === "←") setOtp(otp.slice(0, -1));
                      else if (otp.length < 6)
                        setOtp(otp + num.toString());
                    }}
                    disabled={loading}
                  >
                    {num}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                  disabled={loading}
                >
                  <ArrowLeft className="size-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-[2] h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin size-6" />
                  ) : (
                    "Verify & sign in"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
