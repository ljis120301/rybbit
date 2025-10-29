import { IS_CLOUD } from "../../../lib/const.js";
import { IJobQueue } from "./jobQueue.js";
import { PgBossAdapter } from "./adapters/pgBossAdapter.js";
import { BullMQAdapter } from "./adapters/bullMQAdapter.js";

let queueInstance: IJobQueue | null = null;

/**
 * Get the singleton job queue instance
 * Returns BullMQ for cloud deployments, pg-boss for self-hosted
 */
export const getJobQueue = (): IJobQueue => {
  if (!queueInstance) {
    if (IS_CLOUD) {
      queueInstance = new BullMQAdapter();
    } else {
      queueInstance = new PgBossAdapter();
    }
  }
  return queueInstance;
};
