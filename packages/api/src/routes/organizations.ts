import { Router } from "express";
import {
  createOrganizationSchema,
  ERROR_CODES,
  inviteMemberSchema,
  updateOrganizationSchema,
} from "@clinikchat/shared";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireOrgAdmin, requireOrgMember } from "../lib/access.js";
import { toUserDto } from "../lib/mappers.js";
import { requiredParam } from "../lib/params.js";

export const organizationsRouter = Router();
organizationsRouter.use(requireAuth);

organizationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });
    res.json({
      success: true,
      data: memberships.map((m) => ({
        ...m.organization,
        role: m.role.toLowerCase(),
      })),
    });
  }),
);

organizationsRouter.post(
  "/",
  validateBody(createOrganizationSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { name, slug } = req.body as { name: string; slug: string };
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        members: { create: { userId, role: "owner" } },
      },
    });
    res.status(201).json({ success: true, data: org });
  }),
);

organizationsRouter.get(
  "/:orgId",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const orgId = requiredParam(req, "orgId");
    try {
      await requireOrgMember(userId, orgId);
    } catch {
      res.status(403).json({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: "Not a member of this organization" },
      });
      return;
    }
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
    res.json({ success: true, data: org });
  }),
);

organizationsRouter.patch(
  "/:orgId",
  validateBody(updateOrganizationSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const orgId = requiredParam(req, "orgId");
    try {
      await requireOrgAdmin(userId, orgId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "FORBIDDEN_ORG" || msg === "FORBIDDEN_ADMIN") {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Admin access required" },
        });
        return;
      }
      throw e;
    }
    const body = req.body as { name?: string };
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: { ...(body.name !== undefined && { name: body.name }) },
    });
    res.json({ success: true, data: org });
  }),
);

organizationsRouter.delete(
  "/:orgId",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const orgId = requiredParam(req, "orgId");
    let role: string;
    try {
      const m = await requireOrgMember(userId, orgId);
      role = m.role;
    } catch {
      res.status(403).json({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: "Not a member of this organization" },
      });
      return;
    }
    if (role !== "owner") {
      res.status(403).json({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: "Only the owner can delete the organization" },
      });
      return;
    }
    await prisma.organization.delete({ where: { id: orgId } });
    res.json({ success: true, data: { deleted: true } });
  }),
);

organizationsRouter.get(
  "/:orgId/members",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const orgId = requiredParam(req, "orgId");
    try {
      await requireOrgMember(userId, orgId);
    } catch {
      res.status(403).json({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: "Not a member of this organization" },
      });
      return;
    }
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: true },
    });
    res.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        organizationId: m.organizationId,
        userId: m.userId,
        role: m.role.toLowerCase(),
        joinedAt: m.joinedAt.toISOString(),
        user: m.user ? toUserDto(m.user) : undefined,
      })),
    });
  }),
);

organizationsRouter.post(
  "/:orgId/invite",
  validateBody(inviteMemberSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const orgId = requiredParam(req, "orgId");
    try {
      await requireOrgAdmin(userId, orgId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "FORBIDDEN_ORG" || msg === "FORBIDDEN_ADMIN") {
        res.status(403).json({
          success: false,
          error: { code: ERROR_CODES.FORBIDDEN, message: "Admin access required" },
        });
        return;
      }
      throw e;
    }
    const { email, role } = req.body as { email: string; role: "admin" | "member" };
    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) {
      res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: "No user with that email" },
      });
      return;
    }
    const existing = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: target.id } },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: "User is already a member" },
      });
      return;
    }
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: target.id,
        role: role === "admin" ? "admin" : "member",
      },
      include: { user: true },
    });
    res.status(201).json({
      success: true,
      data: {
        id: member.id,
        organizationId: member.organizationId,
        userId: member.userId,
        role: member.role.toLowerCase(),
        joinedAt: member.joinedAt.toISOString(),
        user: member.user ? toUserDto(member.user) : undefined,
      },
    });
  }),
);
