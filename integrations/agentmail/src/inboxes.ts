import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAgentMailClient } from './client.js';
import type { AgentMailClient, AgentMailClientOptions } from './client.js';

function lazyClient(config?: AgentMailClientOptions) {
  let client: AgentMailClient | null = null;
  return () => {
    if (!client) client = getAgentMailClient(config);
    return client;
  };
}

export function createAgentMailCreateInboxTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-create-inbox',
    description:
      'Create a new AgentMail email inbox. Returns the inbox id, which is the inbox’s full email address. Use this when an agent needs its own email address to send and receive mail.',
    inputSchema: z.object({
      username: z
        .string()
        .optional()
        .describe('Local part of the address (before the @). Randomly generated if omitted.'),
      domain: z.string().optional().describe('Domain for the address. Defaults to agentmail.to.'),
      displayName: z.string().optional().describe('Display name shown to recipients.'),
    }),
    outputSchema: z.object({
      inboxId: z.string().describe('The new inbox’s email address.'),
      displayName: z.string().optional(),
    }),
    execute: async input => {
      const inbox = await getClient().inboxes.create({
        username: input.username,
        domain: input.domain,
        displayName: input.displayName,
      });
      return {
        inboxId: inbox.inboxId,
        displayName: inbox.displayName ?? undefined,
      };
    },
  });
}

export function createAgentMailListInboxesTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-list-inboxes',
    description:
      'List AgentMail inboxes available to this API key. Each inbox id is a full email address.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).optional().describe('Max inboxes to return.'),
      pageToken: z.string().optional().describe('Pagination token from a previous call.'),
    }),
    outputSchema: z.object({
      count: z.number(),
      inboxes: z.array(
        z.object({
          inboxId: z.string(),
          displayName: z.string().optional(),
        }),
      ),
      nextPageToken: z.string().optional(),
    }),
    execute: async input => {
      const res = await getClient().inboxes.list({
        limit: input.limit,
        pageToken: input.pageToken,
      });
      return {
        count: res.count,
        inboxes: (res.inboxes ?? []).map((i: { inboxId: string; displayName?: string }) => ({
          inboxId: i.inboxId,
          displayName: i.displayName ?? undefined,
        })),
        nextPageToken: res.nextPageToken ?? undefined,
      };
    },
  });
}
