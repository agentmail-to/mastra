import { z } from 'zod';

export const recipientsSchema = z
  .union([z.string(), z.array(z.string())])
  .describe('Recipient email address, or a list of addresses');

export const messageSummarySchema = z.object({
  messageId: z.string(),
  threadId: z.string(),
  from: z.string(),
  subject: z.string(),
  preview: z.string(),
  timestamp: z.string(),
  labels: z.array(z.string()),
});

export type MessageSummary = z.infer<typeof messageSummarySchema>;

export function toMessageSummary(m: {
  messageId: string;
  threadId: string;
  from: string;
  subject?: string;
  preview?: string;
  timestamp: Date | string;
  labels?: string[];
}): MessageSummary {
  return {
    messageId: m.messageId,
    threadId: m.threadId,
    from: m.from,
    subject: m.subject ?? '',
    preview: m.preview ?? '',
    timestamp: typeof m.timestamp === 'string' ? m.timestamp : (m.timestamp?.toISOString?.() ?? ''),
    labels: m.labels ?? [],
  };
}

export const sendResultSchema = z.object({
  messageId: z.string(),
  threadId: z.string(),
});
