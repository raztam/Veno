import { z } from 'zod';

export const NoteSummarySchema = z.object({
  title: z.string(),
  summary: z.array(z.string()),
  tasks: z.array(z.object({ text: z.string() })),
  tags: z.array(z.string()),
});

export type NoteSummary = z.infer<typeof NoteSummarySchema>;
