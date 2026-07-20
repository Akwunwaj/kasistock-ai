import { z } from "zod";

export const approvalSchema = z.object({
  id: z.uuid(),
  scenarioId: z.uuid(),
  recommendationVersion: z.string().min(1),
  status: z.enum(["pending", "approved", "rejected"]),
  approvedBy: z.string().nullable(),
  approvedAt: z.iso.datetime().nullable(),
  evidenceHash: z.string().min(32),
});

export type Approval = z.infer<typeof approvalSchema>;
