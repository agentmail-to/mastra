export { getAgentMailClient, type AgentMailClientOptions, type AgentMailClient } from './client.js';
export { createAgentMailCreateInboxTool, createAgentMailListInboxesTool } from './inboxes.js';
export {
  createAgentMailSendMessageTool,
  createAgentMailReplyToMessageTool,
  createAgentMailForwardMessageTool,
  createAgentMailGetMessageTool,
  createAgentMailListMessagesTool,
  createAgentMailSearchMessagesTool,
} from './messages.js';
export { createAgentMailGetThreadTool, createAgentMailListThreadsTool } from './threads.js';
export { createAgentMailCreateDraftTool, createAgentMailSendDraftTool } from './drafts.js';
export { createAgentMailTools } from './tools.js';
