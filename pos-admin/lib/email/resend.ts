import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return null;
  }
  return new Resend(key);
}

export async function sendAdminOtpEmail(input: {
  email: string;
  otp: string;
}): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error(
      "RESEND_FROM_EMAIL is not set (e.g. noreply@yourdomain.com).",
    );
  }

  const resend = getResend();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[dev] Admin OTP for ${input.email}: ${input.otp} (set RESEND_API_KEY to send real email)`,
      );
      return;
    }
    throw new Error("RESEND_API_KEY is not set.");
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.email,
      subject: "Your admin sign-in code",
      html: `
        <p>Your one-time sign-in code is:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${input.otp}</p>
        <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      if (process.env.NODE_ENV === "development") {
        console.info(
          `[dev fallback] Resend failed, but here is your OTP for ${input.email}: ${input.otp}`,
        );
        return;
      }
      throw new Error(error.message);
    }
  } catch (err: any) {
    console.error("Resend Connection/Fetch Error:", err);
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[dev fallback] Resend request crashed, but here is your OTP for ${input.email}: ${input.otp}`,
      );
      return;
    }
    throw err;
  }
}
