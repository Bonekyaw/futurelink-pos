import { NextRequest, NextResponse } from "next/server";
import {
  findActiveUserByPin,
  setSessionCookie,
  signAccessToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

type ClientType = "web" | "mobile";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      pin?: string;
      clientType?: ClientType;
    };

    const pin = body.pin?.trim() ?? "";
    const clientType: ClientType =
      body.clientType === "mobile" ? "mobile" : "web";

    const user = await findActiveUserByPin(pin);
    if (!user) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    const token = await signAccessToken({
      sub: user.id,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      ...(clientType === "mobile" ? { token, expiresIn: 8 * 60 * 60 } : {}),
    });

    if (clientType === "web") {
      setSessionCookie(response, token);
    }

    return response;
  } catch (error) {
    console.error("login:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
