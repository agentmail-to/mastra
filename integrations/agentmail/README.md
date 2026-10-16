# @mastra/agentmail

[AgentMail](https://agentmail.to) email tools for Mastra agents. Give your agents real email inboxes: create inboxes, send, receive, reply, search, and manage threaded conversations and drafts.

AgentMail is an email API built for AI agents. One API call provisions a working inbox with its own address, no OAuth and no human account behind it.

## Installation

```bash
npm install @mastra/agentmail agentmail zod
```

Get an API key from the [AgentMail Console](https://console.agentmail.to) and set it:

```bash
export AGENTMAIL_API_KEY=am_...
```

## Quick start

Use `createAgentMailTools()` to get all twelve tools with shared configuration:

```typescript
import { Agent } from '@mastra/core/agent';
import { createAgentMailTools } from '@mastra/agentmail';

const agent = new Agent({
  id: 'email-assistant',
  name: 'Email Assistant',
  instructions:
    'You manage email through your AgentMail inbox. Use the agentmail tools to send, read, reply, and search.',
  model: 'anthropic/claude-sonnet-4-5',
  tools: createAgentMailTools(),
});
```

Or pick individual tools:

```typescript
import {
  createAgentMailSendMessageTool,
  createAgentMailListMessagesTool,
} from '@mastra/agentmail';

const tools = {
  sendMessage: createAgentMailSendMessageTool(),
  listMessages: createAgentMailListMessagesTool({ apiKey: 'am_...' }),
};
```

By default, all tools read `AGENTMAIL_API_KEY` from the environment. Pass `{ apiKey }` explicitly to override.

## Tools

| Factory | Tool id | What it does |
| --- | --- | --- |
| `createAgentMailCreateInboxTool` | `agentmail-create-inbox` | Create a new inbox. The inbox id is its email address. |
| `createAgentMailListInboxesTool` | `agentmail-list-inboxes` | List inboxes available to this API key. |
| `createAgentMailSendMessageTool` | `agentmail-send-message` | Send a new email, starting a new thread. |
| `createAgentMailReplyToMessageTool` | `agentmail-reply-to-message` | Reply within a thread. Threading handled automatically. |
| `createAgentMailForwardMessageTool` | `agentmail-forward-message` | Forward an email to new recipients. |
| `createAgentMailGetMessageTool` | `agentmail-get-message` | Fetch one email with its full text body. |
| `createAgentMailListMessagesTool` | `agentmail-list-messages` | List recent emails with compact summaries. |
| `createAgentMailSearchMessagesTool` | `agentmail-search-messages` | Full-text search across an inbox. |
| `createAgentMailGetThreadTool` | `agentmail-get-thread` | Fetch a full conversation thread in order. |
| `createAgentMailListThreadsTool` | `agentmail-list-threads` | List conversation threads. |
| `createAgentMailCreateDraftTool` | `agentmail-create-draft` | Stage an email (plain, reply, or forward) without sending. |
| `createAgentMailSendDraftTool` | `agentmail-send-draft` | Send a previously staged draft. |

Every tool declares full Zod input and output schemas and returns compact, structured results.

## Configuration

All factory functions accept `AgentMailClientOptions`:

| Option | Default | Description |
| --- | --- | --- |
| `apiKey` | `AGENTMAIL_API_KEY` env var | Your AgentMail API key. |

## Resources

- AgentMail docs: [docs.agentmail.to](https://docs.agentmail.to)
- Console (API keys): [console.agentmail.to](https://console.agentmail.to)
