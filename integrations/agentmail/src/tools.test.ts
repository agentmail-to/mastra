import { describe, expect, it, vi } from 'vitest';

import type { AgentMailClient } from './client.js';
import { createAgentMailCreateInboxTool } from './inboxes.js';
import { createAgentMailSendMessageTool, createAgentMailSearchMessagesTool } from './messages.js';
import { createAgentMailGetThreadTool } from './threads.js';
import { createAgentMailTools } from './tools.js';

vi.mock('./client.js', async importOriginal => {
  const mod = await importOriginal<typeof import('./client.js')>();
  return {
    ...mod,
    getAgentMailClient: vi.fn(() => mockClient),
  };
});

const mockClient = {
  inboxes: {
    create: vi.fn().mockResolvedValue({ inboxId: 'agent@agentmail.to', displayName: 'Agent' }),
    list: vi.fn().mockResolvedValue({ count: 0, inboxes: [], nextPageToken: undefined }),
    messages: {
      send: vi.fn().mockResolvedValue({ messageId: 'msg_1', threadId: 'thr_1' }),
      reply: vi.fn().mockResolvedValue({ messageId: 'msg_2', threadId: 'thr_1' }),
      forward: vi.fn().mockResolvedValue({ messageId: 'msg_3', threadId: 'thr_2' }),
      get: vi.fn().mockResolvedValue({
        messageId: 'msg_1',
        threadId: 'thr_1',
        from: 'a@example.com',
        subject: 'Hello',
        preview: 'Hi',
        timestamp: new Date('2026-10-15T00:00:00Z'),
        labels: [],
        extractedText: 'Hi, full body.',
        attachments: [],
      }),
      list: vi.fn().mockResolvedValue({ count: 0, messages: [], nextPageToken: undefined }),
      search: vi.fn().mockResolvedValue({ count: 0, messages: [] }),
    },
    threads: {
      get: vi.fn().mockResolvedValue({
        threadId: 'thr_1',
        subject: 'Hello',
        messageCount: 1,
        messages: [
          {
            messageId: 'msg_1',
            threadId: 'thr_1',
            from: 'a@example.com',
            subject: 'Hello',
            preview: 'Hi',
            timestamp: new Date('2026-10-15T00:00:00Z'),
            labels: [],
            extractedText: 'Hi, full body.',
          },
        ],
      }),
      list: vi.fn().mockResolvedValue({ count: 0, threads: [], nextPageToken: undefined }),
    },
    drafts: {
      create: vi.fn().mockResolvedValue({ draftId: 'drf_1', subject: 'Hello' }),
      send: vi.fn().mockResolvedValue({ messageId: 'msg_9', threadId: 'thr_9' }),
    },
  },
} as unknown as AgentMailClient;

describe('createAgentMailTools', () => {
  it('returns all 12 tools with ids, schemas, and descriptions', () => {
    const tools = createAgentMailTools();
    expect(Object.keys(tools)).toHaveLength(12);
    for (const tool of Object.values(tools)) {
      expect(tool.id).toMatch(/^agentmail-/);
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.outputSchema).toBeTruthy();
    }
  });
});

describe('tool execution', () => {
  it('create inbox returns the inbox id', async () => {
    const tool = createAgentMailCreateInboxTool();
    const out = await tool.execute!({ username: 'agent' }, {} as never);
    expect(out).toEqual({ inboxId: 'agent@agentmail.to', displayName: 'Agent' });
  });

  it('send message passes the inbox id and body through', async () => {
    const tool = createAgentMailSendMessageTool();
    const out = await tool.execute!(
      { inboxId: 'agent@agentmail.to', to: 'b@example.com', subject: 'Hi', text: 'Hello!' },
      {} as never,
    );
    expect(out).toEqual({ messageId: 'msg_1', threadId: 'thr_1' });
    expect(mockClient.inboxes.messages.send).toHaveBeenCalledWith(
      'agent@agentmail.to',
      expect.objectContaining({ to: 'b@example.com', subject: 'Hi', text: 'Hello!' }),
    );
  });

  it('search maps query to q', async () => {
    const tool = createAgentMailSearchMessagesTool();
    await tool.execute!({ inboxId: 'agent@agentmail.to', query: 'invoice', limit: 5 }, {} as never);
    expect(mockClient.inboxes.messages.search).toHaveBeenCalledWith('agent@agentmail.to', {
      q: 'invoice',
      limit: 5,
    });
  });

  it('get thread returns ordered messages with text bodies', async () => {
    const tool = createAgentMailGetThreadTool();
    const out = (await tool.execute!(
      { inboxId: 'agent@agentmail.to', threadId: 'thr_1' },
      {} as never,
    )) as { messageCount: number; messages: Array<{ text: string; timestamp: string }> };
    expect(out.messageCount).toBe(1);
    expect(out.messages[0]?.text).toBe('Hi, full body.');
    expect(out.messages[0]?.timestamp).toBe('2026-10-15T00:00:00.000Z');
  });

  it('output matches the declared output schema', async () => {
    const tool = createAgentMailSendMessageTool();
    const out = await tool.execute!(
      { inboxId: 'agent@agentmail.to', to: 'b@example.com', text: 'x' },
      {} as never,
    );
    const schema = tool.outputSchema as unknown as {
      safeParse: (v: unknown) => { success: boolean };
    };
    const parsed = schema.safeParse(out);
    expect(parsed.success).toBe(true);
  });
});
