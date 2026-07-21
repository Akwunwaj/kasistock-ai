import { describe, expect, it } from "vitest";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import {
  PreparedFallbackPersistence,
  WorkflowPersistenceError,
} from "@/modules/persistence/application/workflow-persistence";
import { PostgresWorkflowPersistence } from "@/modules/persistence/infrastructure/postgres-workflow-persistence";

describe("prepared workflow persistence fallback", () => {
  it("reports an explicit non-durable mode without requiring a database", async () => {
    const persistence = new PreparedFallbackPersistence();

    expect(persistence.mode).toBe("prepared_fallback");
    expect(await persistence.ping()).toBe(true);
    expect(await persistence.recordExtraction()).toEqual({
      mode: "prepared_fallback",
      durable: false,
    });
    expect(await persistence.recordApprovedOrderBundle()).toEqual({
      mode: "prepared_fallback",
      durable: false,
    });
    const snapshot = createDemoAcceptedEvidenceBundle()[0]!;
    expect(await persistence.recordAcceptedEvidence({} as never, snapshot)).toEqual({
      snapshot,
      persistence: { mode: "prepared_fallback", durable: false },
    });
  });

  it("classifies a database connection failure as persistence unavailable", async () => {
    const persistence = new PostgresWorkflowPersistence({
      connect: async () => {
        throw new Error("database connection refused");
      },
    } as never);

    await expect(persistence.recordProductMappingSet({} as never)).rejects.toBeInstanceOf(
      WorkflowPersistenceError,
    );
  });
});
