import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getAgentMailClient } from './client.js';
import type { AgentMailClient, AgentMailClientOptions } from './client.js';
import { messageSummarySchema, recipientsSchema, sendResultSchema, toMessageSummary } from './schemas.js';

function lazyClient(config?: AgentMailClientOptions) {
  let client: AgentMailClient | null = null;
  return () => {
    if (!client) client = getAgentMailClient(config);
    return client;
  };
}

export function createAgentMailSendMessageTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-send-message',
    description:
      'Send an email from an AgentMail inbox. inboxId is the sending inbox’s email address. Starts a new thread; to reply within an existing thread use the reply tool instead.',
    inputSchema: z.object({
      inboxId: z.string().describe('The sending inbox’s email address.'),
      to: recipientsSchema,
      cc: recipientsSchema.optional(),
      bcc: recipientsSchema.optional(),
      subject: z.string().optional().describe('Email subject line.'),
      text: z.string().optional().describe('Plain text body.'),
      html: z.string().optional().describe('HTML body.'),
      labels: z.array(z.string()).optional().describe('Labels to attach to the sent message.'),
    }),
    outputSchema: sendResultSchema,
    execute: async input => {
      const res = await getClient().inboxes.messages.send(input.inboxId, {
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        subject: input.subject,
        text: input.text,
        html: input.html,
        labels: input.labels,
      });
      return { messageId: res.messageId, threadId: res.threadId };
    },
  });
}

export function createAgentMailReplyToMessageTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-reply-to-message',
    description:
      'Reply to an email in an AgentMail inbox. Threading headers are handled automatically. Set replyAll to true to include everyone on the thread.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      messageId: z.string().describe('The id of the message being replied to.'),
      text: z.string().optional().describe('Plain text body of the reply.'),
      html: z.string().optional().describe('HTML body of the reply.'),
      replyAll: z.boolean().optional().describe('Reply to all recipients on the thread.'),
    }),
    outputSchema: sendResultSchema,
    execute: async input => {
      const res = await getClient().inboxes.messages.reply(input.inboxId, input.messageId, {
        text: input.text,
        html: input.html,
        replyAll: input.replyAll,
      });
      return { messageId: res.messageId, threadId: res.threadId };
    },
  });
}

export function createAgentMailForwardMessageTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-forward-message',
    description:
      'Forward an email from an AgentMail inbox to new recipients, optionally adding a note.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      messageId: z.string().describe('The id of the message to forward.'),
      to: recipientsSchema,
      text: z
        .string()
        .optional()
        .describe('Optional note to include above the forwarded content.'),
    }),
    outputSchema: sendResultSchema,
    execute: async input => {
      const res = await getClient().inboxes.messages.forward(input.inboxId, input.messageId, {
        to: input.to,
        text: input.text,
      });
      return { messageId: res.messageId, threadId: res.threadId };
    },
  });
}

export function createAgentMailGetMessageTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-get-message',
    description:
      'Get the full content of one email from an AgentMail inbox, including its text body.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      messageId: z.string().describe('The id of the message to fetch.'),
    }),
    outputSchema: messageSummarySchema.extend({
      text: z.string(),
      attachments: z.array(
        z.object({
          attachmentId: z.string(),
          filename: z.string().optional(),
        }),
      ),
    }),
    execute: async input => {
      const m = await getClient().inboxes.messages.get(input.inboxId, input.messageId);
      return {
        ...toMessageSummary(m),
        text: m.extractedText ?? m.text ?? '',
        attachments: (m.attachments ?? []).map(
          (a: { attachmentId: string; filename?: string }) => ({
            attachmentId: a.attachmentId,
            filename: a.filename ?? undefined,
          }),
        ),
      };
    },
  });
}

export function createAgentMailListMessagesTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-list-messages',
    description:
      'List recent emails in an AgentMail inbox, newest first. Returns compact summaries; use the get message tool for a full body.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      limit: z.number().int().min(1).max(100).optional().describe('Max messages to return.'),
      labels: z
        .array(z.string())
        .optional()
        .describe('Only messages with all of these labels.'),
      pageToken: z.string().optional().describe('Pagination token from a previous call.'),
    }),
    outputSchema: z.object({
      count: z.number(),
      messages: z.array(messageSummarySchema),
      nextPageToken: z.string().optional(),
    }),
    execute: async input => {
      const res = await getClient().inboxes.messages.list(input.inboxId, {
        limit: input.limit,
        labels: input.labels,
        pageToken: input.pageToken,
      });
      return {
        count: res.count,
        messages: (res.messages ?? []).map(toMessageSummary),
        nextPageToken: res.nextPageToken ?? undefined,
      };
    },
  });
}

export function createAgentMailSearchMessagesTool(config?: AgentMailClientOptions) {
  const getClient = lazyClient(config);

  return createTool({
    id: 'agentmail-search-messages',
    description: 'Full-text search across emails in an AgentMail inbox, ranked by relevance.',
    inputSchema: z.object({
      inboxId: z.string().describe('The inbox’s email address.'),
      query: z.string().describe('Search query.'),
      limit: z.number().int().min(1).max(100).optional().describe('Max results to return.'),
    }),
    outputSchema: z.object({
      count: z.number(),
      messages: z.array(messageSummarySchema),
    }),
    execute: async input => {
      const res = await getClient().inboxes.messages.search(input.inboxId, {
        q: input.query,
        limit: input.limit,
      });
      return {
        count: res.count,
        messages: (res.messages ?? []).map(toMessageSummary),
      };
    },
  });
}
