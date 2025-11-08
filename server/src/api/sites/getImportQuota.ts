import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getUserHasAdminAccessToSite } from "../../lib/auth-utils.js";
import { ImportQuotaTracker } from "../../services/import/importQuotaChecker.js";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { eq } from "drizzle-orm";

const getImportQuotaRequestSchema = z
  .object({
    params: z.object({
      site: z.string().min(1),
    }),
  })
  .strict();

type GetImportQuotaRequest = {
  Params: z.infer<typeof getImportQuotaRequestSchema.shape.params>;
};

export async function getImportQuota(request: FastifyRequest<GetImportQuotaRequest>, reply: FastifyReply) {
  try {
    const parsed = getImportQuotaRequestSchema.safeParse({
      params: request.params,
    });

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation error" });
    }

    const { site } = parsed.data.params;
    const siteId = Number(site);

    const userHasAccess = await getUserHasAdminAccessToSite(request, site);
    if (!userHasAccess) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Get organization ID from site
    const [siteRecord] = await db
      .select({ organizationId: sites.organizationId })
      .from(sites)
      .where(eq(sites.siteId, siteId))
      .limit(1);

    if (!siteRecord) {
      return reply.status(404).send({ error: "Site not found" });
    }

    // Create quota tracker to get quota information
    const quotaTracker = await ImportQuotaTracker.create(siteRecord.organizationId);
    const summary = quotaTracker.getSummary();

    // Get current month usage from the monthly usage map
    const currentMonth = new Date().toISOString().slice(0, 7).replace("-", ""); // YYYYMM format
    const monthlyUsageMap = await quotaTracker["queryMonthlyUsage"](
      [siteId],
      new Date(new Date().setMonth(new Date().getMonth() - summary.totalMonthsInWindow)).toISOString().split("T")[0]
    );

    return reply.send({
      data: {
        monthlyLimit: quotaTracker["monthlyLimit"],
        historicalWindowMonths: summary.totalMonthsInWindow,
        monthlyUsage: Object.fromEntries(monthlyUsageMap),
        currentMonthUsage: monthlyUsageMap.get(currentMonth) || 0,
        organizationId: siteRecord.organizationId,
        oldestAllowedMonth: summary.oldestAllowedMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching import quota:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
