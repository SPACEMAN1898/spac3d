import type { ChannelType, OrgRole } from "@prisma/client";
import { prisma } from "./prisma.js";

export async function requireOrgMember(
  userId: string,
  organizationId: string,
): Promise<{ role: OrgRole }> {
  const m = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  if (!m) {
    const err = new Error("FORBIDDEN_ORG");
    throw err;
  }
  return { role: m.role };
}

export async function requireOrgAdmin(userId: string, organizationId: string): Promise<void> {
  const { role } = await requireOrgMember(userId, organizationId);
  if (role !== "owner" && role !== "admin") {
    const err = new Error("FORBIDDEN_ADMIN");
    throw err;
  }
}

export async function requireChannelMember(
  userId: string,
  channelId: string,
): Promise<{ organizationId: string; channelType: ChannelType }> {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
    include: { channel: true },
  });
  if (!member) {
    const err = new Error("FORBIDDEN_CHANNEL");
    throw err;
  }
  return { organizationId: member.channel.organizationId, channelType: member.channel.type };
}
