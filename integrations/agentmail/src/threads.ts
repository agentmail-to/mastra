import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAgentMailClient } from './client.js';
import type { AgentMailClient, AgentMailClientOptions } from './client.js';
import { messageSummarySchema, toMessageSummary } from './schemas.js';

function lazyClient(config?: AgentMailClientOptions) {
  let client: AgentMailClient | null = null;
  return () => {
    if (!client) client = getAgentMailClient(config);
    return client;
  };
}

export function createAgentMailGetThreadTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-get-thread',
    description:
      'Get a full email conversation thread from an AgentMail inbox, with every message in order.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      threadId: z.string().describe('The id of the thread to fetch.'),
    }),
    outputSchema: z.object({
      threadId: z.string(),
      subject: z.string(),
      messageCount: z.number(),
      messages: z.array(messageSummarySchema.extend({ text: z.string() })),
    }),
    execute: async input => {
      const t = await getClient().inboxes.threads.get(input.inboxId, input.threadId);
      const messages = (t.messages ?? []) as Array<{
        messageId: string;
        threadId: string;
        from: string;
        subject?: string;
        preview?: string;
        timestamp: Date | string;
        labels?: string[];
        extractedText?: string;
        text?: string;
      }>;
      return {
        threadId: t.threadId,
        subject: t.subject ?? '',
        messageCount: t.messageCount ?? messages.length,
        messages: messages.map(m => ({
          ...toMessageSummary(m),
          text: m.extractedText ?? m.text ?? '',
        })),
      };
    },
  });
}

export function createAgentMailListThreadsTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-list-threads',
    description: 'List email conversation threads in an AgentMail inbox, newest first.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      limit: z.number().int().min(1).max(100).optional().describe('Max threads to return.'),
      labels: z.array(z.string()).optional().describe('Only threads with all of these labels.'),
      pageToken: z.string().optional().describe('Pagination token from a previous call.'),
    }),
    outputSchema: z.object({
      count: z.number(),
      threads: z.array(
        z.object({
          threadId: z.string(),
          subject: z.string(),
          preview: z.string(),
          timestamp: z.string(),
          labels: z.array(z.string()),
        }),
      ),
      nextPageToken: z.string().optional(),
    }),
    execute: async input => {
      const res = await getClient().inboxes.threads.list(input.inboxId, {
        limit: input.limit,
        labels: input.labels,
        pageToken: input.pageToken,
      });
      return {
        count: res.count,
        threads: (res.threads ?? []).map(
          (t: {
            threadId: string;
            subject?: string;
            preview?: string;
            timestamp: Date | string;
            labels?: string[];
          }) => ({
            threadId: t.threadId,
            subject: t.subject ?? '',
            preview: t.preview ?? '',
            timestamp:
              typeof t.timestamp === 'string' ? t.timestamp : (t.timestamp?.toISOString?.() ?? ''),
            labels: t.labels ?? [],
          }),
        ),
        nextPageToken: res.nextPageToken ?? undefined,
      };
    },
  });
}
