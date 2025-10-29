import * as cron from "node-cron";
import { r2Storage } from "../storage/r2StorageService.js";
import { createServiceLogger } from "../../lib/logger/logger.js";

const logger = createServiceLogger("import:cleanup");

class ImportCleanupService {
  private cleanupTask: cron.ScheduledTask | null = null;

  constructor() {}

  /**
   * Initialize the cleanup cron job.
   * Runs daily at 2 AM UTC to clean up orphaned import files.
   */
  initializeCleanupCron() {
    logger.info("Initializing cleanup cron");

    // Schedule cleanup to run daily at 2 AM UTC
    this.cleanupTask = cron.schedule(
      "0 2 * * *",
      async () => {
        try {
          await this.cleanupOrphanedFiles();
        } catch (error) {
          logger.error({ error }, "Error during cleanup");
        }
      },
      { timezone: "UTC" }
    );

    logger.info("Cleanup initialized (runs daily at 2 AM UTC)");
  }

  /**
   * Clean up orphaned R2 import files that are more than 1 day old.
   */
  private async cleanupOrphanedFiles() {
    if (r2Storage.isEnabled()) {
      logger.info("Starting cleanup of old R2 import files");
      try {
        const r2DeletedCount = await r2Storage.deleteOldImportFiles(1);
        logger.info({ deletedCount: r2DeletedCount }, "Deleted old files from R2");
      } catch (error) {
        logger.error({ error }, "Error cleaning up R2 files");
      }
    }
  }

  async triggerManualCleanup() {
    logger.info("Manual cleanup triggered");
    await this.cleanupOrphanedFiles();
  }

  stopCleanupCron() {
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      logger.info("Cleanup cron stopped");
    }
  }
}

// Export singleton instance
export const importCleanupService = new ImportCleanupService();
