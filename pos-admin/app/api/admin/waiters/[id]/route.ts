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

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getSession(request);
  if (!session) {
    return jsonUnauthorized();
  }
  if (session.user.role !== "ADMIN") {
    return jsonForbidden();
  }

  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, role: "WAITER" },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSession(request);
  if (!session) {
    return jsonUnauthorized();
  }
  if (session.user.role !== "ADMIN") {
    return jsonForbidden();
  }

  const { id } = await params;

  const target = await prisma.user.findFirst({
    where: { id, role: "WAITER" },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      pin?: string;
      isActive?: boolean;
    };

    const data: {
      name?: string;
      pin?: string;
      isActive?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.pin !== undefined) {
      const pin = body.pin.trim();
      if (!isValidPinFormat(pin)) {
        return NextResponse.json(
          { error: "pin must be exactly 4 digits" },
          { status: 400 },
        );
      }
      const clash = await findActiveUserByPin(pin);
      if (clash && clash.id !== id) {
        return NextResponse.json(
          { error: "This PIN is already in use" },
          { status: 409 },
        );
      }
      data.pin = await hashPin(pin);
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/admin/waiters/[id]:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession(request);
  if (!session) {
    return jsonUnauthorized();
  }
  if (session.user.role !== "ADMIN") {
    return jsonForbidden();
  }

  const { id } = await params;

  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, role: "WAITER" },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/waiters/[id]:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
