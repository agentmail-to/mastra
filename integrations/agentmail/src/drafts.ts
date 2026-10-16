import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAgentMailClient } from './client.js';
import type { AgentMailClient, AgentMailClientOptions } from './client.js';
import { recipientsSchema, sendResultSchema } from './schemas.js';

function lazyClient(config?: AgentMailClientOptions) {
  let client: AgentMailClient | null = null;
  return () => {
    if (!client) client = getAgentMailClient(config);
    return client;
  };
}

function asList(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

export function createAgentMailCreateDraftTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-create-draft',
    description:
      'Create an email draft in an AgentMail inbox without sending it. For a reply draft set inReplyTo to a message id; for a forward draft set forwardOf. Send it later with the send draft tool.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      to: recipientsSchema.optional(),
      cc: recipientsSchema.optional(),
      bcc: recipientsSchema.optional(),
      subject: z.string().optional().describe('Subject line (ignored for reply drafts).'),
      text: z.string().optional().describe('Plain text body.'),
      html: z.string().optional().describe('HTML body.'),
      inReplyTo: z
        .string()
        .optional()
        .describe('Message id this draft replies to. Mutually exclusive with forwardOf.'),
      forwardOf: z
        .string()
        .optional()
        .describe('Message id this draft forwards. Mutually exclusive with inReplyTo.'),
    }),
    outputSchema: z.object({
      draftId: z.string(),
      subject: z.string(),
    }),
    execute: async input => {
      const client = getClient();
      const d = await client.inboxes.drafts.create(input.inboxId, {
        to: asList(input.to),
        cc: asList(input.cc),
        bcc: asList(input.bcc),
        subject: input.subject,
        text: input.text,
        html: input.html,
        inReplyTo: input.inReplyTo,
        forwardOf: input.forwardOf,
      } as Parameters<typeof client.inboxes.drafts.create>[1]);
      return { draftId: d.draftId, subject: d.subject ?? '' };
    },
  });
}

export function createAgentMailSendDraftTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-send-draft',
    description: 'Send a previously created draft from an AgentMail inbox.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      draftId: z.string().describe('The id of the draft to send.'),
    }),
    outputSchema: sendResultSchema,
    execute: async input => {
      const res = await getClient().inboxes.drafts.send(input.inboxId, input.draftId, {});
      return { messageId: res.messageId, threadId: res.threadId };
    },
  });
}
