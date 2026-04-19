import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  findActiveUserByPin,
  getSession,
  hashPin,
  isValidPinFormat,
  jsonForbidden,
  jsonUnauthorized,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonUnauthorized();
  }
  if (session.user.role !== "ADMIN") {
    return jsonForbidden();
  }

  const waiters = await prisma.user.findMany({
    where: { role: "WAITER" },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(waiters);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonUnauthorized();
  }
  if (session.user.role !== "ADMIN") {
    return jsonForbidden();
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      pin?: string;
    };

    const name = body.name?.trim();
    const pin = body.pin?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!isValidPinFormat(pin)) {
      return NextResponse.json(
        { error: "pin must be exactly 4 digits" },
        { status: 400 },
      );
    }

    const existing = await findActiveUserByPin(pin);
    if (existing) {
      return NextResponse.json(
        { error: "This PIN is already in use" },
        { status: 409 },
      );
    }

    const created = await prisma.user.create({
      data: {
        name,
        pin: await hashPin(pin),
        role: "WAITER",
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/waiters:", error);
    return NextResponse.json(
      { error: "Failed to create waiter" },
      { status: 500 },
    );
  }
}
