/**
 * The provider abstraction. Every LLM backend (local or cloud) implements this same
 * interface, so the research agent, CLI, and server never care which model is behind it.
 * Add a new provider by implementing Provider and registering it in providers/index.ts.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  /** Ask the provider for JSON output where supported. */
  json?: boolean;
  maxTokens?: number;
}

export interface Provider {
  id: string;
  label: string;
  defaultModel: string;
  /** Is this provider usable right now (key present / local server up)? */
  isAvailable(): Promise<boolean>;
  /** Models to offer in the UI. */
  listModels(): Promise<string[]>;
  /** Run a chat completion and return the assistant's text. */
  generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<string>;
}
