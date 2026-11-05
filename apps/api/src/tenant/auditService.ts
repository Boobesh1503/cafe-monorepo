import type { PrismaClient } from '@prisma/client';

export interface RecordAuditEventInput {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class TenantAuditService {
  constructor(private readonly prisma: PrismaClient) {}

  async log(event: RecordAuditEventInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: event.tenantId,
          userId: event.userId ?? null,
          action: event.action,
          entity: event.entity,
          entityId: event.entityId ?? null,
          metadata: (event.metadata as any) ?? {},
          ipAddress: event.ipAddress ?? null,
          userAgent: event.userAgent ?? null,
        },
      });
    } catch (err) {
      console.error('[TenantAuditService] Failed to record audit log event:', err);
    }
  }

  async getTenantLogs(
    tenantId: string,
    limit = 50,
    offset = 0,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }
}

