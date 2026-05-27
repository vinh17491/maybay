import { prisma } from "@/lib/prisma";

export interface AuditLogParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export const AuditService = {
  async log({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    userAgent,
  }: AuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          details: details ? JSON.parse(JSON.stringify(details)) : undefined,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  },

  async getLogs(params: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) {
    return await prisma.auditLog.findMany({
      where: {
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: params.limit || 50,
      skip: params.offset || 0,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  },
};
