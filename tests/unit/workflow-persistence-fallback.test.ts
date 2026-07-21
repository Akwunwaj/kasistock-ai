import { describe, expect, it } from "vitest";
import { PreparedFallbackPersistence } from "@/modules/persistence/application/workflow-persistence";

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
  });
});
