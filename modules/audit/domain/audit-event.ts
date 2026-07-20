import { z } from "zod";

export const auditEventSchema = z.object({
  id: z.uuid(),
  scenarioId: z.uuid(),
  actorType: z.enum(["merchant", "system", "model"]),
  actorId: z.string().min(1),
  eventType: z.string().min(1),
  occurredAt: z.iso.datetime(),
  inputVersion: z.string().nullable(),
  outputVersion: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;
