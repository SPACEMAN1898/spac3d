import type { User as PrismaUser, UserStatus } from "@prisma/client";
import type { User } from "@clinikchat/shared";

export function toUserDto(u: PrismaUser): User {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    status: u.status.toLowerCase() as User["status"],
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

export function prismaStatusFromDto(s: User["status"]): UserStatus {
  return s.toUpperCase() as UserStatus;
}
