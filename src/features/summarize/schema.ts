import { z } from 'zod';

/**
 * The prompt asks for `{ "text": "..." }`, but the on-device model often
 * returns a plain string. Both shapes become `{ text }` before persistence.
 */
const taskTextSchema = z.union([
  z.string(),
  z.object({ text: z.string() }).transform((task) => task.text),
]);

export const NoteSummarySchema = z.object({
  title: z.string(),
  summary: z.array(z.string()),
  tasks: z.array(taskTextSchema).transform((tasks) =>
    tasks
      .map((text) => text.trim())
      .filter((text) => text.length > 0)
      .map((text) => ({ text })),
  ),
  tags: z.array(z.string()),
});

export type NoteSummary = z.infer<typeof NoteSummarySchema>;
