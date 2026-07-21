import { Pool } from "pg";
import {
  PreparedFallbackPersistence,
  type WorkflowPersistence,
} from "@/modules/persistence/application/workflow-persistence";
import { PostgresWorkflowPersistence } from "@/modules/persistence/infrastructure/postgres-workflow-persistence";

const globalPersistence = globalThis as typeof globalThis & {
  kasiStockPersistence?: WorkflowPersistence;
};

export function getWorkflowPersistence(): WorkflowPersistence {
  if (globalPersistence.kasiStockPersistence) return globalPersistence.kasiStockPersistence;

  const connectionString = process.env.DATABASE_URL?.trim();
  globalPersistence.kasiStockPersistence = connectionString
    ? new PostgresWorkflowPersistence(
        new Pool({
          connectionString,
          max: 5,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 5_000,
        }),
      )
    : new PreparedFallbackPersistence();
  return globalPersistence.kasiStockPersistence;
}
