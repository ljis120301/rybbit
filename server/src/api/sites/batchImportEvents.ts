import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getUserHasAdminAccessToSite } from "../../lib/auth-utils.js";
import { clickhouse } from "../../db/clickhouse/clickhouse.js";
import { updateImportProgress, updateImportStatus, getImportById } from "../../services/import/importStatusManager.js";
import { RybbitEvent } from "../../services/import/mappings/rybbit.js";
import { createServiceLogger } from "../../lib/logger/logger.js";

const logger = createServiceLogger("import:batch");

const batchImportRequestSchema = z
  .object({
    params: z.object({
      site: z.string().min(1),
    }),
    body: z.object({
      events: z.array(z.any()).min(1).max(10000), // Limit batch size to 10k events
      importId: z.string().uuid(),
      batchIndex: z.number().int().min(0),
      totalBatches: z.number().int().min(1),
    }),
  })
  .strict();

type BatchImportRequest = {
  Params: z.infer<typeof batchImportRequestSchema.shape.params>;
  Body: z.infer<typeof batchImportRequestSchema.shape.body>;
};

export async function batchImportEvents(request: FastifyRequest<BatchImportRequest>, reply: FastifyReply) {
  try {
    const parsed = batchImportRequestSchema.safeParse({
      params: request.params,
      body: request.body,
    });

    if (!parsed.success) {
      logger.error({ error: parsed.error }, "Validation error");
      return reply.status(400).send({ error: "Validation error", details: parsed.error.flatten() });
    }

    const { site } = parsed.data.params;
    const { events, importId, batchIndex, totalBatches } = parsed.data.body;
    const siteId = Number(site);

    const userHasAccess = await getUserHasAdminAccessToSite(request, site);
    if (!userHasAccess) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Verify import exists and is in valid state
    const importRecord = await getImportById(importId);
    if (!importRecord) {
      logger.error({ importId }, "Import not found");
      return reply.status(404).send({ error: "Import not found" });
    }

    if (importRecord.siteId !== siteId) {
      logger.error({ importId, siteId, recordSiteId: importRecord.siteId }, "Import site mismatch");
      return reply.status(400).send({ error: "Import does not belong to this site" });
    }

    if (importRecord.status === "completed") {
      logger.warn({ importId }, "Attempt to add events to completed import");
      return reply.status(400).send({ error: "Import already completed" });
    }

    if (importRecord.status === "failed") {
      logger.warn({ importId }, "Attempt to add events to failed import");
      return reply.status(400).send({ error: "Import has failed" });
    }

    // Update status to processing if still pending
    if (importRecord.status === "pending") {
      await updateImportStatus(importId, "processing");
    }

    try {
      // Insert events into ClickHouse
      await clickhouse.insert({
        table: "events",
        values: events as RybbitEvent[],
        format: "JSONEachRow",
      });

      logger.info(
        { importId, batchIndex, eventCount: events.length, totalBatches },
        "Batch inserted successfully"
      );

      // Update progress
      await updateImportProgress(importId, events.length);

      return reply.send({
        success: true,
        importedCount: events.length,
        message: `Batch ${batchIndex + 1}/${totalBatches} imported successfully`,
      });
    } catch (insertError) {
      logger.error({ importId, batchIndex, error: insertError }, "Failed to insert batch");

      // Don't mark entire import as failed for individual batch failures
      // The client will retry and handle failures
      return reply.status(500).send({
        success: false,
        error: "Failed to insert events",
        message: insertError instanceof Error ? insertError.message : "Unknown error",
      });
    }
  } catch (error) {
    logger.error({ error }, "Unexpected error in batch import");
    return reply.status(500).send({ error: "Internal server error" });
  }
}
