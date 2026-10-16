import type { AgentMailClientOptions } from './client.js';
import { createAgentMailCreateDraftTool, createAgentMailSendDraftTool } from './drafts.js';
import { createAgentMailCreateInboxTool, createAgentMailListInboxesTool } from './inboxes.js';
import {
  createAgentMailForwardMessageTool,
  createAgentMailGetMessageTool,
  createAgentMailListMessagesTool,
  createAgentMailReplyToMessageTool,
  createAgentMailSearchMessagesTool,
  createAgentMailSendMessageTool,
} from './messages.js';
import { createAgentMailGetThreadTool, createAgentMailListThreadsTool } from './threads.js';

export function createAgentMailTools(config?: AgentMailClientOptions) {
  return {
    agentmailCreateInbox: createAgentMailCreateInboxTool(config),
    agentmailListInboxes: createAgentMailListInboxesTool(config),
    agentmailSendMessage: createAgentMailSendMessageTool(config),
    agentmailReplyToMessage: createAgentMailReplyToMessageTool(config),
    agentmailForwardMessage: createAgentMailForwardMessageTool(config),
    agentmailGetMessage: createAgentMailGetMessageTool(config),
    agentmailListMessages: createAgentMailListMessagesTool(config),
    agentmailSearchMessages: createAgentMailSearchMessagesTool(config),
    agentmailGetThread: createAgentMailGetThreadTool(config),
    agentmailListThreads: createAgentMailListThreadsTool(config),
    agentmailCreateDraft: createAgentMailCreateDraftTool(config),
    agentmailSendDraft: createAgentMailSendDraftTool(config),
  };
}
