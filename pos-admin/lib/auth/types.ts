import type { UserRole } from "@/app/generated/prisma/client";

export type { UserRole };

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
  restaurantId: string;
};

export type PublicUser = {
  id: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
};
