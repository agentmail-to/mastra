import { AgentMailClient } from 'agentmail';

export interface AgentMailClientOptions {
  /** AgentMail API key. Falls back to the AGENTMAIL_API_KEY environment variable. */
  apiKey?: string;
}

export type { AgentMailClient };

export function getAgentMailClient(config?: AgentMailClientOptions): AgentMailClient {
  const apiKey = config?.apiKey ?? process.env.AGENTMAIL_API_KEY;
  if (!apiKey) {
    throw new Error(
      'AgentMail API key is required. Pass { apiKey } or set AGENTMAIL_API_KEY env var.',
    );
  }
  return new AgentMailClient({ apiKey });
}
