import { sql } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { IS_CLOUD } from "../../lib/const.js";

interface AppSumoWebhookPayload {
  test?: boolean;
  event: string;
  license_key: string;
  tier?: string | number;
  parent_license_key?: string;
  license_status?: string;
  event_timestamp?: string;
}

/**
 * Check if AppSumo integration is enabled
 */
function isAppSumoEnabled(): boolean {
  return (
    IS_CLOUD &&
    !!process.env.APPSUMO_CLIENT_ID &&
    !!process.env.APPSUMO_CLIENT_SECRET
  );
}

/**
 * Validate webhook payload
 */
function validateWebhookPayload(payload: AppSumoWebhookPayload): boolean {
  if (!payload.license_key) {
    throw new Error("Missing license_key in webhook payload");
  }

  if (!payload.event) {
    throw new Error("Missing event in webhook payload");
  }

  const validEvents = ["purchase", "activate", "upgrade", "downgrade", "deactivate", "migrate", "test"];
  if (!validEvents.includes(payload.event)) {
    throw new Error(`Invalid event type: ${payload.event}`);
  }

  return true;
}

export async function handleAppSumoWebhook(
  request: FastifyRequest<{
    Body: AppSumoWebhookPayload;
  }>,
  reply: FastifyReply
) {
  if (!isAppSumoEnabled()) {
    return reply.status(503).send({
      error: "AppSumo integration is not available",
    });
  }

  const payload = request.body;

  // Handle test webhook for AppSumo validation
  if (payload.test === true || payload.event === "test") {
    return reply.status(200).send({
      event: "test",
      success: true,
    });
  }

  try {
    // Validate webhook payload
    validateWebhookPayload(payload);

    const {
      license_key,
      event,
      tier,
      parent_license_key,
      license_status,
      event_timestamp,
    } = payload;

    // Log webhook event for audit trail
    await db.execute(sql`
      INSERT INTO appsumo_webhook_events (
        license_key,
        event,
        payload,
        processed_at,
        created_at
      ) VALUES (
        ${license_key},
        ${event},
        ${JSON.stringify(payload)},
        NOW(),
        NOW()
      )
    `);

    // Process the webhook based on event type
    switch (event) {
      case "purchase":
        // License purchased - create placeholder record
        await handlePurchaseEvent(license_key, tier, parent_license_key);
        break;

      case "activate":
        // License activated - should already be handled by activate endpoint
        // But we can update the status if needed
        await handleActivateEvent(license_key, tier);
        break;

      case "upgrade":
        // License upgraded to higher tier
        await handleUpgradeEvent(license_key, tier);
        break;

      case "downgrade":
        // License downgraded to lower tier
        await handleDowngradeEvent(license_key, tier);
        break;

      case "deactivate":
        // License refunded or canceled - mark as inactive
        await handleDeactivateEvent(license_key);
        break;

      case "migrate":
        // Add-on migration when parent license changes
        await handleMigrateEvent(license_key, tier, parent_license_key);
        break;

      default:
        console.warn(`Unknown AppSumo webhook event: ${event}`);
    }

    // Return success response as required by AppSumo
    return reply.status(200).send({
      event: event,
      success: true,
    });
  } catch (error) {
    console.error("Error processing AppSumo webhook:", error);

    // Still return 200 to acknowledge receipt, but log the error
    return reply.status(200).send({
      event: payload.event || "unknown",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handle purchase event - create placeholder license record
 */
async function handlePurchaseEvent(
  licenseKey: string,
  tier: any,
  parentLicenseKey?: string
) {
  const tierValue = tier?.toString() || "1";

  // Check if license already exists
  const existing = await db.execute(
    sql`SELECT id FROM appsumo_licenses WHERE license_key = ${licenseKey} LIMIT 1`
  );

  if (Array.isArray(existing) && existing.length === 0) {
    // Create placeholder - will be linked to org when user activates
    await db.execute(sql`
      INSERT INTO appsumo_licenses (
        organization_id,
        license_key,
        tier,
        status,
        parent_license_key,
        created_at,
        updated_at
      ) VALUES (
        NULL,
        ${licenseKey},
        ${tierValue},
        'pending',
        ${parentLicenseKey || null},
        NOW(),
        NOW()
      )
      ON CONFLICT (license_key) DO NOTHING
    `);
  }
}

/**
 * Handle activate event - update license status
 */
async function handleActivateEvent(licenseKey: string, tier: any) {
  const tierValue = tier?.toString() || "1";

  await db.execute(sql`
    UPDATE appsumo_licenses
    SET
      status = 'active',
      tier = ${tierValue},
      activated_at = NOW(),
      updated_at = NOW()
    WHERE license_key = ${licenseKey}
  `);
}

/**
 * Handle upgrade event - update tier
 */
async function handleUpgradeEvent(licenseKey: string, tier: any) {
  const tierValue = tier?.toString() || "1";

  await db.execute(sql`
    UPDATE appsumo_licenses
    SET
      tier = ${tierValue},
      updated_at = NOW()
    WHERE license_key = ${licenseKey}
  `);
}

/**
 * Handle downgrade event - update tier
 */
async function handleDowngradeEvent(licenseKey: string, tier: any) {
  const tierValue = tier?.toString() || "1";

  await db.execute(sql`
    UPDATE appsumo_licenses
    SET
      tier = ${tierValue},
      updated_at = NOW()
    WHERE license_key = ${licenseKey}
  `);
}

/**
 * Handle deactivate event - mark license as inactive
 */
async function handleDeactivateEvent(licenseKey: string) {
  await db.execute(sql`
    UPDATE appsumo_licenses
    SET
      status = 'inactive',
      deactivated_at = NOW(),
      updated_at = NOW()
    WHERE license_key = ${licenseKey}
  `);
}

/**
 * Handle migrate event - update parent license for add-ons
 */
async function handleMigrateEvent(
  licenseKey: string,
  tier: any,
  parentLicenseKey?: string
) {
  const tierValue = tier?.toString() || "1";

  await db.execute(sql`
    UPDATE appsumo_licenses
    SET
      tier = ${tierValue},
      parent_license_key = ${parentLicenseKey || null},
      updated_at = NOW()
    WHERE license_key = ${licenseKey}
  `);
}
