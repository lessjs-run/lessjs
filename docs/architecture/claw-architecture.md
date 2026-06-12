# CLAW Architecture — Desktop AI Coding Agent

> **CLAW** = Code + Law (rules engine) + Agent + Workbench.
> Fork/reimagining of mimocode → opencode lineage, rebuilt on Deno + Tauri 2 + openElement.

---

## 1. System Architecture

### 1.1 Process Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        TAURI 2 DESKTOP SHELL                      │
│                                                                    │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐ │
│  │        WEBVIEW (Frontend)   │  │     RUST CORE (src-tauri)  │ │
│  │                             │  │                            │ │
│  │  openElement Web Components │  │  • Sidecar lifecycle mgmt  │ │
│  │  • <claw-app>               │  │  • FS plugin (read/write)  │ │
│  │  • <chat-thread>            │  │  • Shell plugin (exec)     │ │
│  │  • <chat-message>           │  │  • Window management       │ │
│  │  • <chat-input>             │  │  • Tray/notifications      │ │
│  │  • <ide-panel>              │◄─┤  • Config persistence      │ │
│  │  • <file-tree>              │  │  • Auto-updater            │ │
│  │  • <diff-view>              │  │                            │ │
│  │  • <tool-output>            │  │                            │ │
│  │  • <status-bar>             │  │                            │ │
│  │                             │  │                            │ │
│  │  State: Signals (TC39-like) │  │                            │ │
│  │  IPC: fetch() to localhost  │  │                            │ │
│  └──────────┬──────────────────┘  └─────────────┬──────────────┘ │
│             │                                    │                │
│             │ HTTP (localhost:PORT)               │ sidecar spawn │
│             │ SSE streaming                       │ stdin/stdout  │
│             ▼                                    ▼                │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              DENO AGENT SERVER (sidecar binary)               │ │
│  │                                                               │ │
│  │  Hono HTTP server on random port                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │ REST API │ │ SSE Hub  │ │ Agent    │ │ Tool Executor│   │ │
│  │  │ /chat    │ │ /stream  │ │ Loop     │ │ (shell, fs)  │   │ │
│  │  │ /tools   │ │          │ │          │ │              │   │ │
│  │  │ /health  │ │          │ │          │ │              │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  │                                                               │ │
│  │  Providers: DeepSeek (primary), OpenAI, Anthropic             │ │
│  │  Protocols: @claw/protocols (runtime-free interfaces)         │ │
│  └───────────────────────────┬──────────────────────────────────┘ │
│                               │                                    │
└───────────────────────────────┼────────────────────────────────────┘
                                │ HTTPS (api.deepseek.com)
                                ▼
                    ┌───────────────────────┐
                    │   DEEPSEEK API        │
                    │   • /chat/completions │
                    │   • SSE streaming     │
                    │   • reasoning_content │
                    └───────────────────────┘
```

### 1.2 Key Architecture Decisions

| Decision               | Choice                                                                      | Rationale                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Deno runtime**       | Sidecar binary (`deno compile`)                                             | Clean process isolation; Tauri manages lifecycle; no V8-in-Rust embedding complexity                                                  |
| **IPC protocol**       | HTTP + SSE (Hono server)                                                    | WebView has native `fetch()`/`EventSource`; SSE is HTTP-native; testable with curl; stdio is more complex for bidirectional streaming |
| **Tool execution**     | Dual-path: Tauri fs plugin for file ops, Deno `Deno.run` for shell commands | File ops need Tauri permissions; shell commands need full OS access with user consent                                                 |
| **Frontend rendering** | openElement DsdElement + signals (no React/Vue/Lit)                         | Zero framework overhead; DSD for SSR if needed later; signals for fine-grained reactivity; consistent with openElement ecosystem      |
| **Streaming**          | SSE from DeepSeek → Deno → EventSource in WebView                           | Native browser API; no WebSocket overhead; compatible with DeepSeek SSE format                                                        |
| **State management**   | Signals (TC39-style, `@openelement/signals`)                                | Same reactive engine as openElement; fine-grained DOM updates; no virtual DOM diffing                                                 |

---

## 2. Protocol Definitions (`@claw/protocols`)

Following openElement's pattern: **runtime-free TypeScript interfaces + conformance tests**. Zero dependencies.

### 2.1 Message Protocol

```typescript
// packages/protocols/src/messages.ts

/** Role of a message in a conversation. */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** Content types supported in messages. */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };

export interface ImageSource {
  type: 'base64';
  media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
  data: string;
}

/** A single message in the conversation. */
export interface Message {
  id: string; // UUIDv4
  role: MessageRole;
  content: ContentBlock[];
  timestamp: number; // Date.now()
  /** Token count metadata (populated after API call). */
  usage?: TokenUsage;
}

/** Token usage info from provider. */
export interface TokenUsage {
  input: number;
  output: number;
  cache_read?: number; // DeepSeek context caching
  cache_write?: number;
  reasoning?: number; // DeepSeek-R1 reasoning tokens
  total: number;
}
```

### 2.2 Agent Protocol

```typescript
// packages/protocols/src/agent.ts

import type { Message, TokenUsage } from './messages.ts';
import type { ToolCall, ToolDefinition, ToolResult } from './tools.ts';

/** Agent configuration. */
export interface AgentConfig {
  provider: ProviderId;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  /** Maximum conversation turns (user + assistant pairs). */
  maxTurns: number;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

export type ProviderId = 'deepseek' | 'openai' | 'anthropic';

/** Agent execution mode. */
export type AgentMode =
  | { type: 'chat' } // Single-turn, no tools
  | { type: 'agent'; tools: ToolDefinition[] } // Multi-turn with tool loop
  | { type: 'plan' }; // Plan-first, then execute

/** The agent's current state in the loop. */
export type AgentState =
  | { status: 'idle' }
  | { status: 'thinking'; startedAt: number }
  | { status: 'calling_tool'; toolCall: ToolCall }
  | { status: 'processing_results'; toolResults: ToolResult[] }
  | { status: 'responding' }
  | { status: 'done'; stopReason: StopReason; usage: TokenUsage }
  | { status: 'error'; error: AgentError };

export type StopReason = 'end_turn' | 'max_tokens' | 'tool_use' | 'stop_sequence' | 'cancelled';

export interface AgentError {
  code:
    | 'PROVIDER_ERROR'
    | 'TOOL_ERROR'
    | 'TIMEOUT'
    | 'CONTEXT_OVERFLOW'
    | 'CANCELLED'
    | 'PARSE_ERROR';
  message: string;
  retryable: boolean;
  details?: unknown;
}

/** Event stream from agent execution (SSE-serializable). */
export type AgentEvent =
  | { type: 'state_change'; state: AgentState }
  | { type: 'text_delta'; content: string }
  | { type: 'reasoning_delta'; content: string } // DeepSeek-R1
  | { type: 'tool_call_delta'; toolCall: Partial<ToolCall> }
  | { type: 'tool_result'; result: ToolResult }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'error'; error: AgentError }
  | { type: 'done' };

/** Agent protocol — must be implemented by every agent engine. */
export interface AgentProtocol {
  /** Execute a conversation turn, yielding streaming events. */
  run(
    messages: Message[],
    config: AgentConfig,
    mode: AgentMode,
    tools?: ToolDefinition[],
  ): AsyncGenerator<AgentEvent, void, undefined>;

  /** Abort the current run. */
  abort(): void;
}
```

### 2.3 Tool Protocol

```typescript
// packages/protocols/src/tools.ts

/** JSON Schema for tool input parameters. */
export interface JsonSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    default?: unknown;
  }>;
  required: string[];
  additionalProperties?: boolean;
}

/** Tool definition as sent to the AI provider. */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: JsonSchema;
  /** Execution context required (e.g., 'filesystem', 'shell', 'network'). */
  requires: ToolPermission[];
}

export type ToolPermission = 'filesystem' | 'shell' | 'network' | 'clipboard' | 'notification';

/** A tool call from the AI. */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  /** When the call was initiated. */
  timestamp: number;
}

/** Result from executing a tool. */
export interface ToolResult {
  tool_use_id: string;
  /** Structured output for the AI. */
  content: string;
  /** Whether the tool call resulted in an error. */
  is_error: boolean;
  /** Duration in ms. */
  duration_ms: number;
  /** Human-readable output for the UI (diff, markdown, raw text). */
  display?: ToolDisplay;
}

/** UI display hints for tool results. */
export type ToolDisplay =
  | { type: 'text'; content: string }
  | { type: 'diff'; original: string; modified: string; language: string }
  | { type: 'file_tree'; tree: FileTreeNode[] }
  | { type: 'grep_results'; matches: GrepMatch[] }
  | { type: 'code'; content: string; language: string; path?: string };

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

/** Tool protocol — must be implemented by every tool. */
export interface ToolProtocol {
  readonly definition: ToolDefinition;

  /** Validate input against the tool's schema. Returns error message if invalid. */
  validate(input: Record<string, unknown>): string | null;

  /** Execute the tool. */
  execute(call: ToolCall, context: ToolContext): Promise<ToolResult>;
}

/** Execution context passed to tools at runtime. */
export interface ToolContext {
  /** Working directory (project root). */
  cwd: string;
  /** Read a file (via Tauri fs plugin). */
  readFile(path: string): Promise<string>;
  /** Write a file (via Tauri fs plugin). */
  writeFile(path: string, content: string): Promise<void>;
  /** Execute a shell command. */
  exec(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; code: number }>;
  /** Abort signal. */
  signal?: AbortSignal;
  /** Callback to report intermediate progress. */
  onProgress?(message: string): void;
}
```

### 2.4 Provider Protocol

```typescript
// packages/protocols/src/provider.ts

import type { Message, TokenUsage } from './messages.ts';
import type { ToolCall, ToolDefinition } from './tools.ts';

/** Provider configuration. */
export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  /** Maximum context window size in tokens. */
  contextWindow: number;
  /** Maximum output tokens. */
  maxOutputTokens: number;
}

/** Raw request to a provider. */
export interface ProviderRequest {
  messages: Message[];
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  tools?: ToolDefinition[];
  /** If true, enable thinking/reasoning mode (DeepSeek-R1, Claude Opus). */
  reasoning?: boolean;
  signal?: AbortSignal;
}

/** Raw response from a provider (one chunk of a stream). */
export type ProviderChunk =
  | { type: 'text_delta'; content: string }
  | { type: 'reasoning_delta'; content: string }
  | { type: 'tool_call_delta'; id: string; name?: string; arguments?: string }
  | { type: 'tool_call_complete'; call: ToolCall }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'done'; stopReason: string }
  | { type: 'error'; message: string; code: number };

/** Provider protocol — must be implemented by every AI provider adapter. */
export interface ProviderProtocol {
  /** Provider identifier. */
  readonly id: string;
  /** Provider configuration. */
  readonly config: ProviderConfig;

  /** Count tokens for a list of messages (for context window management). */
  countTokens(messages: Message[]): number;

  /** Stream a chat completion. Yields raw provider chunks. */
  stream(request: ProviderRequest): AsyncGenerator<ProviderChunk, void, undefined>;

  /** Non-streaming completion (for planning, summarization). */
  complete(request: ProviderRequest): Promise<{
    content: string;
    toolCalls?: ToolCall[];
    usage: TokenUsage;
  }>;
}
```

### 2.5 Session Protocol

```typescript
// packages/protocols/src/session.ts

import type { Message, TokenUsage } from './messages.ts';

/** A persistent conversation session. */
export interface Session {
  /** Unique session ID. */
  id: string;
  /** Session title (auto-generated from first message). */
  title: string;
  /** Creation timestamp. */
  createdAt: number;
  /** Last activity timestamp. */
  updatedAt: number;
  /** Conversation messages. */
  messages: Message[];
  /** Session metadata. */
  meta: SessionMeta;
}

export interface SessionMeta {
  /** Working directory for this session. */
  cwd: string;
  /** Provider + model used. */
  provider: string;
  model: string;
  /** Git branch at session start. */
  gitBranch?: string;
  /** Total token usage across the session. */
  totalUsage: TokenUsage;
  /** User-assigned tags/labels. */
  tags: string[];
  /** Whether the session is archived. */
  archived: boolean;
}

/** Persistence protocol for session storage. */
export interface SessionStore {
  /** List all sessions, most recent first. */
  list(): Promise<Session[]>;
  /** Get a session by ID. */
  get(id: string): Promise<Session | null>;
  /** Create or update a session. */
  save(session: Session): Promise<void>;
  /** Delete a session. */
  delete(id: string): Promise<void>;
  /** Export session to markdown file. */
  exportMarkdown(id: string): Promise<string>;
}
```

### 2.6 Conformance Tests

```typescript
// packages/protocols/src/conformance.ts

import type { AgentConfig, AgentMode, AgentProtocol } from './agent.ts';
import type { ToolCall, ToolContext, ToolDefinition, ToolProtocol } from './tools.ts';
import type { ProviderConfig, ProviderProtocol, ProviderRequest } from './provider.ts';
import type { Session, SessionStore } from './session.ts';

export interface ConformanceResult {
  name: string;
  passed: boolean;
  message?: string;
}

/** Tool conformance: must validate input and execute. */
export async function runToolConformance(
  tool: ToolProtocol,
  validInput: Record<string, unknown>,
  invalidInput: Record<string, unknown>,
  context: ToolContext,
): Promise<ConformanceResult[]> {
  const results: ConformanceResult[] = [];

  // Must have a definition
  results.push(
    tool.definition?.name && tool.definition?.description
      ? { name: 'tool.definition', passed: true }
      : {
        name: 'tool.definition',
        passed: false,
        message: 'definition.name and definition.description are required',
      },
  );

  // Valid input must pass validation
  const validError = tool.validate(validInput);
  results.push(
    validError === null
      ? { name: 'tool.validate.valid', passed: true }
      : { name: 'tool.validate.valid', passed: false, message: validError },
  );

  // Invalid input must fail validation
  const invalidError = tool.validate(invalidInput);
  results.push(
    invalidError !== null ? { name: 'tool.validate.invalid', passed: true } : {
      name: 'tool.validate.invalid',
      passed: false,
      message: 'Expected validation error for invalid input',
    },
  );

  // Must execute successfully
  const call: ToolCall = {
    id: 'conformance-test',
    name: tool.definition.name,
    input: validInput,
    timestamp: Date.now(),
  };
  try {
    const result = await tool.execute(call, context);
    results.push(
      result.tool_use_id === call.id
        ? { name: 'tool.execute', passed: true }
        : { name: 'tool.execute', passed: false, message: 'Result tool_use_id must match call id' },
    );
  } catch (e) {
    results.push({ name: 'tool.execute', passed: false, message: `Execution threw: ${String(e)}` });
  }

  return results;
}

/** Provider conformance: must stream responses. */
export async function* runProviderConformance(
  provider: ProviderProtocol,
): AsyncGenerator<ConformanceResult> {
  yield provider.id
    ? { name: 'provider.id', passed: true }
    : { name: 'provider.id', passed: false, message: 'id is required' };

  yield provider.config?.apiKey
    ? { name: 'provider.config.apiKey', passed: true }
    : { name: 'provider.config.apiKey', passed: false, message: 'apiKey is required' };

  const request: ProviderRequest = {
    messages: [{
      id: 'test',
      role: 'user',
      content: [{ type: 'text', text: 'Say hello' }],
      timestamp: Date.now(),
    }],
    model: provider.config.defaultModel,
    systemPrompt: 'You are a test.',
    maxTokens: 50,
    temperature: 0,
    signal: AbortSignal.timeout(10000),
  };

  try {
    let receivedText = false;
    for await (const chunk of provider.stream(request)) {
      if (chunk.type === 'text_delta') receivedText = true;
      if (chunk.type === 'error') {
        yield { name: 'provider.stream', passed: false, message: chunk.message };
        return;
      }
    }
    yield {
      name: 'provider.stream',
      passed: receivedText,
      message: receivedText ? undefined : 'No text deltas received',
    };
  } catch (e) {
    yield { name: 'provider.stream', passed: false, message: String(e) };
  }
}
```

---

## 3. Data Flow: User Message → Agent → Tool Calls → Response

### 3.1 Complete Request Lifecycle

```
User types "add error handling to login.ts"
        │
        ▼
[1] <chat-input> dispatches 'claw:send' event
        │
        ▼
[2] <claw-app> adds message to signal([]), sends POST /chat
        │
        ▼
[3] Deno Hono server receives POST /chat
        │  - Adds user message to session
        │  - Constructs system prompt with workspace context
        │  - Calls Agent.run()
        ▼
[4] Agent.run() iterates:
        │
        ├── [4a] Context compression if needed
        │    (truncates oldest messages, keeps system prompt + recent)
        │
        ├── [4b] Provider.stream() → DeepSeek API
        │    SSE chunks streamed back
        │
        ├── [4c] If AI returns text_delta:
        │    → yield AgentEvent { type: 'text_delta', content }
        │    → SSE to WebView
        │
        ├── [4d] If AI returns tool_call:
        │    → yield AgentEvent { type: 'tool_call_delta', ... }
        │    → When call complete: yield { type: 'state_change', status: 'calling_tool' }
        │    → Execute tool via ToolContext
        │    → yield AgentEvent { type: 'tool_result', result }
        │    → Add tool_use + tool_result to messages[]
        │    → Loop back to [4b] with tool results
        │
        └── [4e] If AI returns done:
            → yield AgentEvent { type: 'done' }
            → Save session

[5] WebView receives SSE events:
        │
        ├── text_delta     → append to streaming message bubble
        ├── reasoning_delta→ show in collapsible "thinking" section
        ├── tool_call_delta→ show tool indicator in message
        ├── tool_result    → add <tool-output> below message
        ├── usage          → update <status-bar> token counter
        └── done           → finalize message, enable input

[6] User sees response with optional tool outputs
```

### 3.2 SSE Event Wire Format

```
event: text_delta
data: {"type":"text_delta","content":"I'll add"}

event: text_delta
data: {"type":"text_delta","content":" error handling to login.ts"}

event: tool_call_delta
data: {"type":"tool_call_delta","id":"call_abc","name":"read_file","arguments":"{\"path\":\"src/login.ts\"}"}

event: tool_result
data: {"type":"tool_result","result":{"tool_use_id":"call_abc","content":"[file contents...]","is_error":false,"duration_ms":12}}

event: text_delta
data: {"type":"text_delta","content":"Now I'll add try-catch..."}

event: usage
data: {"type":"usage","usage":{"input":1520,"output":340,"total":1860}}

event: done
data: {"type":"done"}
```

### 3.3 Tool Approval Flow

For safety, certain tools require user approval:

```
Tool invoked by AI
     │
     ▼
┌─────────────────────────────┐
│ Is tool in always-allow set?│
└──────────┬──────────────────┘
     Yes   │         No
     ▼     │         ▼
  Execute  │   ┌──────────────────────────┐
           │   │ Is auto-approve enabled? │
           │   └──────────┬───────────────┘
           │        Yes   │         No
           │        ▼     │         ▼
           │    Execute    │   Show approval dialog in WebView
           │              │         │
           │              │    User approves? ──No──→ return error to AI
           │              │         │
           │              │        Yes
           │              │         │
           │              ▼         ▼
           │           Execute tool
           │              │
           └──────────────┘
                  │
                  ▼
            Return result to agent loop
```

**Approval configuration per tool:**

- `read_file` → always-allow
- `grep` → always-allow
- `glob` → always-allow
- `write_file` → approve once per file, then allow
- `bash` → approve each command (show command before running)
- `git` → approve destructive operations (push, commit --amend); allow read-only

---

## 4. Deno HTTP Server API Design

### 4.1 Router (Hono)

```typescript
// deno-server/src/router.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import type { AgentProtocol, SessionStore } from '@claw/protocols';

export function createRouter(
  agent: AgentProtocol,
  sessions: SessionStore,
  providerRegistry: ProviderRegistry,
) {
  const app = new Hono();

  // CORS for WebView localhost access
  app.use('*', cors({ origin: '*' }));

  // ─── Health ─────────────────────────────────────────
  app.get('/health', (c) =>
    c.json({
      status: 'ok',
      version: '0.1.0',
      uptime: performance.now(),
      providers: providerRegistry.list(),
    }));

  // ─── Session CRUD ───────────────────────────────────
  app.get('/api/sessions', async (c) => {
    const list = await sessions.list();
    return c.json(list);
  });

  app.get('/api/sessions/:id', async (c) => {
    const session = await sessions.get(c.req.param('id'));
    if (!session) return c.json({ error: 'Not found' }, 404);
    return c.json(session);
  });

  app.post('/api/sessions', async (c) => {
    const body = await c.req.json<{ cwd: string }>();
    const session = createSession(body.cwd);
    await sessions.save(session);
    return c.json(session, 201);
  });

  app.delete('/api/sessions/:id', async (c) => {
    await sessions.delete(c.req.param('id'));
    return c.json({ ok: true });
  });

  // ─── Chat (SSE streaming) ───────────────────────────
  app.post('/api/sessions/:id/chat', async (c) => {
    const sessionId = c.req.param('id');
    const body = await c.req.json<ChatRequest>();

    const session = await sessions.get(sessionId);
    if (!session) return c.json({ error: 'Session not found' }, 404);

    // Add user message
    const userMessage = createMessage('user', body.content);
    session.messages.push(userMessage);
    await sessions.save(session);

    // Build agent config from request
    const config = buildAgentConfig(body, session);

    return streamSSE(c, async (stream) => {
      const controller = new AbortController();
      config.signal = controller.signal;

      // Handle client disconnect
      stream.onAbort(() => controller.abort());

      try {
        let assistantContent = '';
        for await (
          const event of agent.run(
            session.messages,
            config,
            body.mode ?? { type: 'agent', tools: getAvailableTools(body.tools) },
            getAvailableTools(body.tools),
          )
        ) {
          // Forward event as SSE
          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event),
          });

          // Accumulate assistant text for saving
          if (event.type === 'text_delta') {
            assistantContent += event.content;
          }
        }

        // Save assistant message to session
        if (assistantContent) {
          session.messages.push(
            createMessage('assistant', [{ type: 'text', text: assistantContent }]),
          );
          await sessions.save(session);
        }
      } catch (error) {
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({
            type: 'error',
            error: { code: 'PROVIDER_ERROR', message: String(error), retryable: true },
          }),
        });
      }
    });
  });

  // ─── Abort active chat ──────────────────────────────
  app.post('/api/sessions/:id/abort', (c) => {
    agent.abort();
    return c.json({ ok: true });
  });

  // ─── Tool listing ───────────────────────────────────
  app.get('/api/tools', (c) => {
    return c.json(
      getAvailableTools().map((t) => ({
        name: t.definition.name,
        description: t.definition.description,
      })),
    );
  });

  // ─── File operations (proxy to Tauri fs plugin) ─────
  app.post('/api/fs/read', async (c) => {
    const { path } = await c.req.json<{ path: string }>();
    const content = await Deno.readTextFile(path);
    return c.json({ content });
  });

  app.post('/api/fs/write', async (c) => {
    const { path, content } = await c.req.json<{ path: string; content: string }>();
    await Deno.writeTextFile(path, content);
    return c.json({ ok: true });
  });

  // ─── Shell execution ────────────────────────────────
  app.post('/api/shell', async (c) => {
    const { command, cwd } = await c.req.json<{ command: string; cwd?: string }>();
    const cmd = Deno.build.os === 'windows'
      ? new Deno.Command('cmd', { args: ['/c', command], cwd })
      : new Deno.Command('sh', { args: ['-c', command], cwd });
    const { stdout, stderr, code } = await cmd.output();
    return c.json({
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
      code,
    });
  });

  return app;
}
```

### 4.2 Sidecar Lifecycle (Tauri Rust Side)

```rust
// src-tauri/src/sidecar.rs
use tauri::api::process::{Command, CommandEvent};
use std::sync::Mutex;
use rand::Rng;

pub struct SidecarManager {
    port: Mutex<u16>,
    process: Mutex<Option<tauri::api::process::CommandChild>>,
}

impl SidecarManager {
    /// Spawn the Deno sidecar, waiting for it to report its port.
    pub async fn spawn(&self, app: tauri::AppHandle) -> Result<u16, String> {
        let port = rand::thread_rng().gen_range(12000..13000);

        let (mut rx, child) = Command::new_sidecar("claw-server")
            .expect("failed to create sidecar command")
            .args(["--port", &port.to_string()])
            .spawn()
            .map_err(|e| e.to_string())?;

        *self.process.lock().unwrap() = Some(child);

        // Wait for server to print "READY" to stdout
        // (Deno server writes "READY:PORT" to stdout on startup)
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(line) = event {
                if line.contains("READY") {
                    break;
                }
            }
        }

        *self.port.lock().unwrap() = port;
        Ok(port)
    }

    /// Kill the sidecar process.
    pub fn kill(&self) {
        if let Some(mut child) = self.process.lock().unwrap().take() {
            let _ = child.kill();
        }
    }

    pub fn port(&self) -> u16 {
        *self.port.lock().unwrap()
    }
}
```

---

## 5. DeepSeek Adapter Specifics

### 5.1 Key Differences from OpenAI

| Feature             | OpenAI                      | DeepSeek                                                | Handling                                                  |
| ------------------- | --------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Tool calling format | `tool_calls` array in delta | Same format, but `arguments` may arrive in fewer chunks | Accumulate `arguments` string, parse when complete        |
| Reasoning tokens    | N/A                         | `reasoning_content` field in delta (R1 models)          | Expose as `reasoning_delta` event, show in collapsible UI |
| SSE format          | `data: {...}` per line      | Same, but may include `[DONE]` or empty lines           | Robust SSE parser handles all variants                    |
| System prompt       | `role: 'system'`            | Same                                                    | Same                                                      |
| Context caching     | Not exposed                 | DeepSeek v3 has implicit caching, R1 does not           | Track cache hits via `usage.cache_read_tokens`            |
| Max context         | 128K (gpt-4o)               | 128K (v3), 64K (R1)                                     | Enforce per-model context window                          |
| Temperature         | 0-2                         | 0-2 (v3), fixed ~0.6 (R1)                               | R1 ignores temperature; warn user                         |
| Top-p               | Standard                    | Standard                                                | Pass through                                              |

### 5.2 DeepSeek Provider Implementation

```typescript
// deno-server/src/providers/deepseek.ts

import type {
  ProviderChunk,
  ProviderConfig,
  ProviderProtocol,
  ProviderRequest,
} from '@claw/protocols';
import type { ToolCall, ToolDefinition } from '@claw/protocols';

export class DeepSeekProvider implements ProviderProtocol {
  readonly id = 'deepseek';

  readonly config: ProviderConfig = {
    apiKey: '', // Set from user config
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v3-0324',
    contextWindow: 128_000,
    maxOutputTokens: 8192,
  };

  constructor(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  countTokens(messages: import('@claw/protocols').Message[]): number {
    // DeepSeek uses GPT-4 tokenizer. Approximate: 1 token ≈ 3 chars for English,
    // 1 token ≈ 1.5 chars for code. Use a weighted heuristic.
    let total = 0;
    for (const msg of messages) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          total += Math.ceil(block.text.length / 3);
        }
        if (block.type === 'tool_use') {
          total += Math.ceil(JSON.stringify(block.input).length / 3);
        }
        if (block.type === 'tool_result') {
          total += Math.ceil(block.content.length / 3);
        }
      }
    }
    return total;
  }

  async *stream(request: ProviderRequest): AsyncGenerator<ProviderChunk, void, undefined> {
    const body = this._buildRequestBody(request);
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      yield {
        type: 'error',
        message: `DeepSeek API ${response.status}: ${error}`,
        code: response.status,
      };
      return;
    }

    // --- SSE Stream Parsing ---
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // Track in-progress tool calls
    const toolCallAccumulator: Map<number, { id: string; name?: string; arguments: string }> =
      new Map();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const choice = json.choices?.[0];
            if (!choice) continue;

            const delta = choice.delta;

            // --- Text content ---
            if (delta?.content) {
              yield { type: 'text_delta', content: delta.content };
            }

            // --- Reasoning content (DeepSeek-R1) ---
            if (delta?.reasoning_content) {
              yield { type: 'reasoning_delta', content: delta.reasoning_content };
            }

            // --- Tool calls ---
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                let acc = toolCallAccumulator.get(idx);
                if (!acc) {
                  acc = { id: tc.id ?? '', name: tc.function?.name, arguments: '' };
                  toolCallAccumulator.set(idx, acc);
                }
                // Update fields
                if (tc.id) acc.id = tc.id;
                if (tc.function?.name) acc.name = tc.function.name;
                if (tc.function?.arguments) acc.arguments += tc.function.arguments;

                yield {
                  type: 'tool_call_delta',
                  id: acc.id,
                  name: acc.name,
                  arguments: tc.function?.arguments,
                };
              }
            }

            // --- Check finish_reason for tool calls ---
            if (choice.finish_reason === 'tool_calls') {
              for (const [_, acc] of toolCallAccumulator) {
                let parsedInput: Record<string, unknown> = {};
                try {
                  parsedInput = JSON.parse(acc.arguments || '{}');
                } catch { /* use empty */ }

                yield {
                  type: 'tool_call_complete',
                  call: {
                    id: acc.id,
                    name: acc.name ?? 'unknown',
                    input: parsedInput,
                    timestamp: Date.now(),
                  },
                };
              }
              toolCallAccumulator.clear();
            }

            // --- Usage ---
            if (json.usage) {
              yield {
                type: 'usage',
                usage: {
                  input: json.usage.prompt_tokens ?? 0,
                  output: json.usage.completion_tokens ?? 0,
                  cache_read: json.usage.prompt_cache_hit_tokens ?? 0,
                  cache_write: json.usage.prompt_cache_miss_tokens ?? 0,
                  reasoning: json.usage.reasoning_tokens ?? 0,
                  total: json.usage.total_tokens ?? 0,
                },
              };
            }

            // --- Done ---
            if (choice.finish_reason && choice.finish_reason !== 'tool_calls') {
              yield { type: 'done', stopReason: choice.finish_reason };
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }

      // Process remaining buffer
      // ...
    } finally {
      reader.releaseLock();
    }
  }

  async complete(request: ProviderRequest): Promise<{
    content: string;
    toolCalls?: ToolCall[];
    usage: import('@claw/protocols').TokenUsage;
  }> {
    const body = { ...this._buildRequestBody(request), stream: false };
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API ${response.status}: ${await response.text()}`);
    }

    const json = await response.json();
    const msg = json.choices[0].message;

    return {
      content: msg.content ?? '',
      toolCalls: msg.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments),
        timestamp: Date.now(),
      })),
      usage: {
        input: json.usage.prompt_tokens ?? 0,
        output: json.usage.completion_tokens ?? 0,
        total: json.usage.total_tokens ?? 0,
      },
    };
  }

  private _buildRequestBody(request: ProviderRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: request.model,
      messages: this._formatMessages(request.messages, request.systemPrompt),
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: true,
    };

    if (request.tools?.length) {
      body.tools = request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.input_schema,
        },
      }));
    }

    return body;
  }

  private _formatMessages(
    messages: import('@claw/protocols').Message[],
    systemPrompt: string,
  ): unknown[] {
    const formatted: unknown[] = [{ role: 'system', content: systemPrompt }];

    for (const msg of messages) {
      if (msg.role === 'system') continue; // Skip — we use our own system prompt

      if (msg.role === 'user') {
        // Extract text and images
        const textBlocks = msg.content.filter((b) => b.type === 'text');
        const imageBlocks = msg.content.filter((b) => b.type === 'image');

        if (imageBlocks.length === 0) {
          formatted.push({ role: 'user', content: textBlocks.map((b) => b.text).join('\n') });
        } else {
          // Multi-modal: array of content blocks
          formatted.push({
            role: 'user',
            content: [
              ...textBlocks.map((b) => ({ type: 'text', text: b.text })),
              ...imageBlocks.map((b) => ({
                type: 'image_url',
                image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` },
              })),
            ],
          });
        }
      }

      if (msg.role === 'assistant') {
        const toolUses = msg.content.filter((b) => b.type === 'tool_use');
        const textBlocks = msg.content.filter((b) => b.type === 'text');

        formatted.push({
          role: 'assistant',
          content: textBlocks.map((b) => b.text).join('\n') || null,
          tool_calls: toolUses.length > 0
            ? toolUses.map((tc) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.input) },
            }))
            : undefined,
        });
      }

      if (msg.role === 'tool') {
        const toolResults = msg.content.filter((b) => b.type === 'tool_result');
        for (const tr of toolResults) {
          formatted.push({
            role: 'tool',
            tool_call_id: tr.tool_use_id,
            content: tr.content,
          });
        }
      }
    }

    return formatted;
  }
}
```

### 5.3 System Prompt Engineering for Coding Tasks

```typescript
// deno-server/src/prompts/coding.ts

export function buildSystemPrompt(context: {
  cwd: string;
  os: string;
  shell: string;
  date: string;
  gitBranch?: string;
  fileTree?: string; // Top-level tree for context
}): string {
  return `You are CLAW — a desktop AI coding agent running on ${context.os}.

## Environment
- Working directory: ${context.cwd}
- Shell: ${context.shell}
- Date: ${context.date}${context.gitBranch ? `\n- Git branch: ${context.gitBranch}` : ''}

## Capabilities
You have access to tools for reading, writing, editing, and searching files, as well as executing shell commands. Use them proactively.

## Coding Guidelines
1. **Read before write.** Always read the files you plan to modify first.
2. **Edit, don't rewrite.** Use targeted edits (replace_in_file) rather than rewriting entire files.
3. **Preserve style.** Match the existing code style, indentation, and naming conventions.
4. **Handle errors.** Add proper error handling; don't leave TODOs without explanation.
5. **Explain changes.** Before making changes, briefly explain what you're doing and why.
6. **Test your work.** After making changes, verify they compile/parse by running relevant commands.
7. **One task at a time.** Focus on the user's specific request. Don't make unrelated "improvements".

## Communication
- Be concise. The user is a developer.
- Use code blocks for code snippets.
- When a tool fails, explain what went wrong and try an alternative approach.
- If you're unsure about something, ask rather than guessing.
- Show the actual code changes you intend to make.

## Project Context${
    context.fileTree ? `\n\nCurrent project structure:\n\`\`\`\n${context.fileTree}\n\`\`\`` : ''
  }`;
}
```

---

## 6. Frontend Component Tree

### 6.1 Component Hierarchy

```
<html>
  <head>
    <script type="module" src="claw-app.js">
  </head>
  <body>
    <claw-app>                                    ← Root: state, routing, IPC
      ├── <status-bar>                            ← Session info, token usage, model
      ├── <ide-panel>                             ← Split pane container
      │   ├── panel="left"
      │   │   ├── <file-tree>                     ← File explorer
      │   │   └── <session-list>                  ← Recent sessions
      │   ├── panel="center"
      │   │   └── <chat-thread>                   ← Scrollable message list
      │   │       ├── <chat-message>              ← User message bubble
      │   │       ├── <chat-message>              ← AI message bubble
      │   │       │   ├── (markdown content)
      │   │       │   ├── <tool-output>           ← Collapsible tool result
      │   │       │   │   ├── <diff-view>         ← Code diff
      │   │       │   │   └── <open-code-block>   ← Syntax-highlighted code
      │   │       │   └── <reasoning-panel>       ← R1 thinking (collapsible)
      │   │       └── <chat-message streaming>    ← Currently streaming
      │   └── panel="bottom"
      │       └── <chat-input>                    ← Composable input
      │           ├── <file-mention>              ← @file autocomplete
      │           └── <command-palette>           ← /slash commands
      └── <settings-modal>                        ← API key, model, theme
    </claw-app>
  </body>
</html>
```

### 6.2 Component Specifications

#### `<claw-app>` — Root Application Shell

```typescript
// components/src/claw-app.tsx

import { DsdElement } from '@openelement/core';
import { signal } from '@openelement/signals';
import type { Session } from '@claw/protocols';

export class ClawApp extends DsdElement {
  // --- State Signals ---
  #sessions = signal<Session[]>([]);
  #activeSession = signal<Session | null>(null);
  #streamingMessage = signal<string>(''); // Current streaming text
  #agentState = signal<AgentState>({ status: 'idle' });
  #tokenUsage = signal<TokenUsage | null>(null);
  #settingsOpen = signal(false);

  // --- IPC to Deno Server ---
  #serverPort: number; // Set by Tauri invoke('get_server_port')

  // Lifecycle
  override onDsdHydrated(): void {
    this.#loadSessions();
    this.#connectSSE(); // Reconnect if needed
  }

  // Methods
  async #sendMessage(content: ContentBlock[]): Promise<void> {
    const session = this.#activeSession.value;
    if (!session) return;

    const response = await fetch(
      `http://localhost:${this.#serverPort}/api/sessions/${session.id}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mode: { type: 'agent' } }),
      },
    );

    // Stream SSE events
    const reader = response.body!.getReader();
    // ... process SSE stream, update signals
  }
}
```

#### `<chat-thread>` — Message List with Auto-Scroll

```typescript
// components/src/chat-thread.tsx

export class ChatThread extends DsdElement {
  static override styles = [sheet];

  // Props (via attributes)
  // messages: Message[]
  // streaming: string

  override render() {
    const messages = this.#getMessages();
    const streaming = this.#getStreaming();

    return (
      <div class='chat-thread' part='thread'>
        {messages.map((msg) => (
          <chat-message
            message={JSON.stringify(msg)}
            data-signal='messages'
          />
        ))}
        {streaming && <chat-message streaming='true' content={streaming} />}
        <div class='scroll-anchor' part='anchor'></div>
      </div>
    );
  }

  // Auto-scroll via MutationObserver in onDsdHydrated()
  override onDsdHydrated(): void {
    this.#setupAutoScroll();
  }
}
```

#### `<chat-message>` — Message Bubble

```typescript
// components/src/chat-message.tsx

export class ChatMessage extends DsdElement {
  static override styles = [sheet];
  static override observedAttributes = ['role', 'content', 'streaming', 'reasoning', 'usage'];

  override render() {
    const role = this.getAttribute('role') || 'user';
    const content = this.getAttribute('content') || '';
    const streaming = this.hasAttribute('streaming');
    const reasoning = this.getAttribute('reasoning');
    const usage = this.#parseUsage();

    return (
      <div
        class={`message message--${role}${streaming ? ' message--streaming' : ''}`}
        part='bubble'
      >
        <div class='message__header' part='header'>
          <span class='message__role' part='role'>{role === 'assistant' ? 'CLAW' : 'You'}</span>
          {usage && <span class='message__tokens' part='tokens'>{usage.total} tokens</span>}
        </div>

        {reasoning && (
          <details class='reasoning-panel' part='reasoning' open>
            <summary>Thinking...</summary>
            <div class='reasoning-content' innerHTML={this.#renderMarkdown(reasoning)}></div>
          </details>
        )}

        <div class='message__content' part='content' innerHTML={this.#renderMarkdown(content)}>
        </div>

        {streaming && <span class='message__cursor'>▊</span>}
      </div>
    );
  }

  // Markdown rendering (marked.js or similar, lazy-loaded)
  #renderMarkdown(text: string): string {
    // Escape HTML, then render markdown
    // Code blocks wrapped in <open-code-block>
    return markdownToHtml(text);
  }
}
```

#### `<chat-input>` — Composable Input

```typescript
// components/src/chat-input.tsx

export class ChatInput extends DsdElement {
  static override styles = [sheet];

  #value = signal('');
  #attachedFiles = signal<AttachedFile[]>([]);
  #mentionOpen = signal(false);
  #mentionQuery = signal('');
  #mentionItems = signal<FileMention[]>([]);

  override render() {
    return (
      <div class="chat-input" part="container">
        {/* Attached files */}
        {this.#attachedFiles.value.map(f => (
          <span class="chip" part="chip">
            {f.name}
            <button onClick={() => this.#removeFile(f.path)}>×</button>
          </span>
        ))}

        {/* Input area */}
        <div class="input-row" part="row">
          <textarea
            class="input-textarea"
            part="textarea"
            placeholder="Ask anything... Use @ to mention files"
            rows="1"
            value={this.#value}
            onInput={(e: InputEvent) => this.#handleInput(e)}
            onKeydown={(e: KeyboardEvent) => this.#handleKeydown(e)}
          ></textarea>

          <button class="send-btn" part="send" onClick={() => this.#send()} disabled={!this.#value.value.trim()}>
            <svg><!-- Send icon --></svg>
          </button>
        </div>

        {/* @mention dropdown */}
        {this.#mentionOpen.value && (
          <div class="mention-dropdown" part="mention-dropdown">
            {this.#mentionItems.value.map(item => (
              <button class="mention-item" onClick={() => this.#selectMention(item)}>
                <span class="mention-name">{item.name}</span>
                <span class="mention-path">{item.path}</span>
              </button>
            ))}
          </div>
        )}

        {/* Mode indicator */}
        <div class="input-footer" part="footer">
          <span class="mode-badge">{this.#getModeLabel()}</span>
          <span class="model-badge">{this.#getModelLabel()}</span>
        </div>
      </div>
    );
  }

  #handleInput(e: InputEvent): void {
    const textarea = e.target as HTMLTextAreaElement;
    this.#value.value = textarea.value;

    // Auto-resize
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    // Detect @mention trigger
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.slice(0, cursorPos);
    const mentionMatch = textBefore.match(/@(\S*)$/);
    if (mentionMatch) {
      this.#mentionOpen.value = true;
      this.#mentionQuery.value = mentionMatch[1];
      this.#searchFiles(mentionMatch[1]);
    } else {
      this.#mentionOpen.value = false;
    }
  }

  #handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.#send();
    }
    if (e.key === 'Escape' && this.#mentionOpen.value) {
      this.#mentionOpen.value = false;
      e.preventDefault();
    }
  }

  #send(): void {
    const text = this.#value.value.trim();
    if (!text) return;

    this.dispatchEvent(new CustomEvent('claw:send', {
      bubbles: true,
      composed: true,
      detail: {
        content: [{ type: 'text', text }],
        attachedFiles: this.#attachedFiles.value.map(f => f.path),
      },
    }));

    this.#value.value = '';
  }
}
```

#### `<tool-output>` — Collapsible Tool Result

```typescript
// components/src/tool-output.tsx

export class ToolOutput extends DsdElement {
  static override styles = [sheet];

  static override observedAttributes = ['tool-name', 'duration', 'status', 'display-type'];

  override render() {
    const toolName = this.getAttribute('tool-name') || '';
    const duration = this.getAttribute('duration') || '';
    const status = this.getAttribute('status') || 'success';
    const displayType = this.getAttribute('display-type') || 'text';

    // Icons per tool
    const icon = {
      read_file: '📄',
      write_file: '✏️',
      bash: '⚡',
      grep: '🔍',
      glob: '📁',
      edit: '🔧',
    }[toolName] || '🔧';

    return (
      <details class={`tool-output tool-output--${status}`} part='container' open>
        <summary class='tool-summary' part='summary'>
          <span class='tool-icon'>{icon}</span>
          <span class='tool-name'>{toolName}</span>
          <span class='tool-duration'>{duration}ms</span>
          <span class={`tool-status tool-status--${status}`}>
            {status === 'error' ? '❌' : '✓'}
          </span>
        </summary>
        <div class='tool-content' part='content'>
          <slot></slot>
        </div>
      </details>
    );
  }
}
```

#### `<diff-view>` — Code Diff Display

```typescript
// components/src/diff-view.tsx

export class DiffView extends DsdElement {
  static override styles = [diffSheet];
  static override observedAttributes = ['original', 'modified', 'language'];

  override render() {
    const original = this.getAttribute('original') || '';
    const modified = this.getAttribute('modified') || '';
    const language = this.getAttribute('language') || '';

    // Compute diff (using a minimal diff algorithm)
    const hunks = this.#computeDiff(original, modified);

    return (
      <div class='diff-view' part='container'>
        {hunks.map((hunk) => (
          <div class='diff-hunk' part='hunk'>
            <div class='diff-hunk-header' part='hunk-header'>
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>
            {hunk.lines.map((line) => (
              <div class={`diff-line diff-line--${line.type}`} part='line'>
                <span class='diff-line-prefix'>
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                </span>
                <span class='diff-line-content' innerHTML={this.#highlight(line.content, language)}>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}
```

#### `<file-tree>` — File Explorer

```typescript
// components/src/file-tree.tsx

export class FileTree extends DsdElement {
  static override styles = [treeSheet];

  #tree = signal<FileTreeNode[]>([]);

  override onDsdHydrated(): void {
    this.#loadTree();
  }

  async #loadTree(): Promise<void> {
    const port = (window as any).__CLAW_PORT__;
    const resp = await fetch(`http://localhost:${port}/api/fs/tree`);
    this.#tree.value = await resp.json();
  }

  override render() {
    return (
      <div class='file-tree' part='container'>
        {this.#tree.value.map((node) => this.#renderNode(node, 0))}
      </div>
    );
  }

  #renderNode(node: FileTreeNode, depth: number) {
    if (node.type === 'directory') {
      return (
        <details class='tree-folder' open={depth < 2}>
          <summary class='tree-folder-name' style={`padding-left: ${depth * 16}px`}>
            📁 {node.name}
          </summary>
          {node.children?.map((child) => this.#renderNode(child, depth + 1))}
        </details>
      );
    }
    return (
      <div
        class='tree-file'
        style={`padding-left: ${depth * 16}px`}
        onClick={() => this.#openFile(node.path)}
      >
        📄 {node.name}
      </div>
    );
  }
}
```

#### `<status-bar>` — Session Status

```typescript
// components/src/status-bar.tsx

export class StatusBar extends DsdElement {
  static override styles = [statusSheet];

  override render() {
    return (
      <div class='status-bar' part='container'>
        <span class='status-item' part='session'>
          {this.#getSessionTitle()}
        </span>
        <span class='status-item' part='model'>
          {this.#getModel()}
        </span>
        <span class='status-item' part='tokens'>
          {this.#getTokenUsage()}
        </span>
        <span class='status-item' part='state'>
          {this.#getAgentStateEmoji()}
        </span>
      </div>
    );
  }
}
```

---

## 7. Tauri Integration Points

### 7.1 File System Capabilities

```rust
// src-tauri/src/fs.rs

use tauri::Manager;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileEntry>>,
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_directory(path: String, max_depth: u32) -> Result<Vec<FileEntry>, String> {
    list_dir_recursive(&path, 0, max_depth)
}

fn list_dir_recursive(path: &str, depth: u32, max_depth: u32) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    let dir = std::fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') || name == "node_modules" || name == "target" {
            continue;
        }

        let is_dir = path.is_dir();
        let children = if is_dir && depth < max_depth {
            Some(list_dir_recursive(&path.to_string_lossy(), depth + 1, max_depth)?)
        } else {
            None
        };

        entries.push(FileEntry {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir,
            children,
        });
    }

    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir { b.is_dir.cmp(&a.is_dir) }
        else { a.name.cmp(&b.name) }
    });

    Ok(entries)
}
```

### 7.2 Tauri Configuration (`tauri.conf.json`)

```json
{
  "productName": "CLAW",
  "version": "0.1.0",
  "identifier": "com.claw.app",
  "build": {
    "frontendDist": "../www/dist",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "deno task build",
    "beforeDevCommand": "deno task dev"
  },
  "app": {
    "windows": [
      {
        "title": "CLAW",
        "width": 1400,
        "height": 900,
        "minWidth": 900,
        "minHeight": 600,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; connect-src http://localhost:* http://127.0.0.1:* https://api.deepseek.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "externalBin": [
      "binaries/claw-server"
    ]
  },
  "plugins": {
    "fs": {
      "scope": {
        "allow": ["**"],
        "requireLiteralLeadingDot": false
      }
    },
    "shell": {
      "scope": [
        {
          "name": "run-command",
          "cmd": "cmd",
          "args": true
        }
      ]
    }
  }
}
```

### 7.3 Tauri Main Entry Point

```rust
// src-tauri/src/main.rs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod fs;
mod sidecar;
mod config;

use tauri::Manager;
use sidecar::SidecarManager;
use std::sync::Arc;

fn main() {
    let sidecar = Arc::new(SidecarManager::new());

    tauri::Builder::default()
        .setup(|app| {
            let sidecar_clone = sidecar.clone();
            let handle = app.handle().clone();

            // Spawn sidecar on startup
            tauri::async_runtime::spawn(async move {
                match sidecar_clone.spawn(handle.clone()).await {
                    Ok(port) => {
                        // Store port in app state for frontend to query
                        handle.manage(PortState(port));
                        println!("CLAW server ready on port {}", port);
                    }
                    Err(e) => {
                        eprintln!("Failed to start CLAW server: {}", e);
                    }
                }
            });

            Ok(())
        })
        .manage(ConfigState::default())
        .invoke_handler(tauri::generate_handler![
            fs::read_file,
            fs::write_file,
            fs::list_directory,
            config::get_config,
            config::set_config,
            get_server_port,
        ])
        .on_window_event(|event| {
            if let tauri::WindowEvent::Destroyed = event.event() {
                // Kill sidecar when all windows are closed
                // (sidecar management handled via Drop on SidecarManager)
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running CLAW");
}

struct PortState(u16);

#[tauri::command]
fn get_server_port(state: tauri::State<PortState>) -> u16 {
    state.0
}
```

---

## 8. File Structure

```
claw/
├── Cargo.toml                        # Rust workspace (Tauri)
├── Cargo.lock
├── src-tauri/                        # Tauri Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── icons/
│   ├── src/
│   │   ├── main.rs                   # Entry point
│   │   ├── sidecar.rs                # Deno binary lifecycle
│   │   ├── fs.rs                     # File system commands
│   │   ├── config.rs                 # Config persistence (JSON)
│   │   └── updater.rs               # Auto-update logic
│   └── binaries/                     # Compiled sidecar binaries
│       ├── claw-server-x86_64-pc-windows-msvc.exe
│       ├── claw-server-x86_64-apple-darwin
│       └── claw-server-x86_64-unknown-linux-gnu
│
├── deno-server/                      # Deno agent server (SEPARATE — deno compile compat)
│   ├── deno.json                     # Deno config (imports, tasks)
│   ├── deno.lock
│   ├── src/
│   │   ├── main.ts                   # Entry: start Hono server
│   │   ├── router.ts                 # Hono API routes
│   │   ├── agent/
│   │   │   ├── loop.ts               # Agent loop: run → tool calls → run
│   │   │   ├── context.ts            # Context window management + compression
│   │   │   └── session.ts            # Session persistence (JSON files)
│   │   ├── providers/
│   │   │   ├── deepseek.ts           # DeepSeek API adapter
│   │   │   ├── openai.ts             # OpenAI API adapter
│   │   │   ├── anthropic.ts          # Anthropic/Claude API adapter
│   │   │   └── registry.ts           # Provider factory + registry
│   │   ├── tools/
│   │   │   ├── read_file.ts          # Read file contents
│   │   │   ├── write_file.ts         # Write/create file
│   │   │   ├── edit_file.ts          # Targeted string replacements
│   │   │   ├── bash.ts               # Shell command execution
│   │   │   ├── grep.ts               # Content search (regex)
│   │   │   ├── glob.ts               # File pattern matching
│   │   │   ├── list_dir.ts           # Directory listing
│   │   │   ├── git_diff.ts           # Git diff/staging
│   │   │   ├── web_fetch.ts          # Fetch URL content
│   │   │   └── registry.ts           # Tool registry
│   │   ├── prompts/
│   │   │   ├── coding.ts             # Default coding system prompt
│   │   │   └── templates.ts          # Prompt templates (review, explain, etc.)
│   │   └── utils/
│   │       ├── token-counter.ts      # Approximate token counting
│   │       ├── diff.ts               # Compute text diffs
│   │       └── sse.ts                # SSE helper utilities
│   └── build.ts                      # Build script: deno compile → sidecar binary
│
├── www/                              # Frontend (served by Tauri WebView)
│   ├── index.html                    # Entry HTML
│   ├── dist/                         # Built frontend (for Tauri bundle)
│   └── src/
│       ├── app.ts                    # Bootstrap: register components, init IPC
│       ├── components/               # openElement Web Components
│       │   ├── claw-app.tsx
│       │   ├── chat-thread.tsx
│       │   ├── chat-message.tsx
│       │   ├── chat-input.tsx
│       │   ├── ide-panel.tsx
│       │   ├── file-tree.tsx
│       │   ├── diff-view.tsx
│       │   ├── tool-output.tsx
│       │   ├── status-bar.tsx
│       │   ├── reasoning-panel.tsx
│       │   ├── settings-modal.tsx
│       │   ├── session-list.tsx
│       │   └── shared/
│       │       ├── icons.tsx          # SVG icon components
│       │       ├── theme.ts           # CSS custom properties
│       │       └── signals.ts         # Shared signals (theme, state)
│       └── styles/
│           ├── global.css
│           └── theme.css
│
├── packages/
│   └── protocols/                    # @claw/protocols — runtime-free interfaces
│       ├── deno.json
│       ├── src/
│       │   ├── index.ts              # Re-exports
│       │   ├── messages.ts           # Message, ContentBlock, TokenUsage
│       │   ├── agent.ts              # AgentProtocol, AgentEvent, AgentConfig
│       │   ├── tools.ts              # ToolProtocol, ToolDefinition, ToolContext
│       │   ├── provider.ts           # ProviderProtocol, ProviderChunk
│       │   ├── session.ts            # Session, SessionStore
│       │   └── conformance.ts        # Conformance test helpers
│       └── __tests__/
│           ├── tool-conformance.test.ts
│           ├── provider-conformance.test.ts
│           └── agent-conformance.test.ts
│
├── scripts/
│   ├── build-sidecar.ts              # Cross-compile Deno to sidecar binary
│   ├── dev.sh                        # Dev mode: start Deno server + Tauri dev
│   └── release.sh                    # Build + package for distribution
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Test protocols, deno-server, Rust
│       ├── build.yml                 # Cross-platform build matrix
│       └── release.yml               # Publish to GitHub Releases
│
├── deno.json                         # Root Deno workspace config
├── README.md
└── LICENSE
```

---

## 9. Build and Distribution Pipeline

### 9.1 Development Flow

```bash
# Terminal 1: Start Deno server in dev mode (watch + reload)
deno task dev:server
# → Hono server on http://localhost:12000

# Terminal 2: Start Tauri dev (serves www/, connects to Deno server)
cargo tauri dev
# → Opens Tauri window, connects to Deno server
```

### 9.2 Build Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD PIPELINE                            │
│                                                                  │
│  Step 1: Build Deno server as self-contained binary             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ deno compile --allow-read --allow-write --allow-net     │     │
│  │   --allow-run --allow-env --output                      │     │
│  │   src-tauri/binaries/claw-server deno-server/src/main.ts│     │
│  └───────────────┬────────────────────────────────────────┘     │
│                  │                                               │
│  Step 2: Build frontend                                         │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ deno task build  (or vite build)                        │     │
│  │ → Output: www/dist/                                     │     │
│  └───────────────┬────────────────────────────────────────┘     │
│                  │                                               │
│  Step 3: Build Tauri app (cargo tauri build)                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • Embeds www/dist/ as WebView content                   │     │
│  │ • Bundles sidecar binary for target platform            │     │
│  │ • Signs and notarizes (macOS)                           │     │
│  │ → Output: .dmg / .msi / .AppImage / .deb               │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Cross-Platform Build Matrix

| Platform    | Sidecar Binary                           | Installer            |
| ----------- | ---------------------------------------- | -------------------- |
| Windows x64 | `claw-server-x86_64-pc-windows-msvc.exe` | `.msi` (WiX)         |
| macOS x64   | `claw-server-x86_64-apple-darwin`        | `.dmg`               |
| macOS arm64 | `claw-server-aarch64-apple-darwin`       | `.dmg`               |
| Linux x64   | `claw-server-x86_64-unknown-linux-gnu`   | `.AppImage` / `.deb` |

### 9.4 Deno Tasks (`deno-server/deno.json`)

```json
{
  "tasks": {
    "dev": "deno run --allow-all --watch src/main.ts --port 12000",
    "build": "deno run --allow-all build.ts",
    "compile:windows": "deno compile --allow-read --allow-write --allow-net --allow-run --allow-env --target x86_64-pc-windows-msvc --output ../src-tauri/binaries/claw-server-x86_64-pc-windows-msvc.exe src/main.ts",
    "compile:macos-x64": "deno compile --allow-read --allow-write --allow-net --allow-run --allow-env --target x86_64-apple-darwin --output ../src-tauri/binaries/claw-server-x86_64-apple-darwin src/main.ts",
    "compile:macos-arm64": "deno compile --allow-read --allow-write --allow-net --allow-run --allow-env --target aarch64-apple-darwin --output ../src-tauri/binaries/claw-server-aarch64-apple-darwin src/main.ts",
    "compile:linux": "deno compile --allow-read --allow-write --allow-net --allow-run --allow-env --target x86_64-unknown-linux-gnu --output ../src-tauri/binaries/claw-server-x86_64-unknown-linux-gnu src/main.ts",
    "test": "deno test --allow-read --allow-write --allow-env --allow-net",
    "typecheck": "deno check src/main.ts"
  }
}
```

---

## 10. Error Handling Strategy

### 10.1 Error Propagation

```
Provider Error (API down, rate limit, bad key)
  → ProviderChunk { type: 'error', ... }
  → Agent captures, wraps as AgentEvent { type: 'error', ... }
  → SSE to frontend
  → <status-bar> shows error badge
  → User can retry or switch provider

Tool Error (file not found, permission denied, syntax error in bash)
  → ToolResult { is_error: true, content: "Error: ..." }
  → Agent adds to conversation, AI can try alternative approach
  → <tool-output status="error"> shows red styling

Network Error (SSE disconnect, timeout)
  → EventSource onerror → reconnect with exponential backoff
  → Auto-resume: send last message IDs, agent replays from checkpoint

Context Overflow (too many tokens)
  → Agent detects before API call
  → Applies compression strategy (summarize old messages)
  → If still over limit → error returned to user: "Conversation too long"
```

### 10.2 Retry Strategy

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelay: number;
    onRetry?: (attempt: number, error: Error) => void;
  },
): Promise<T> {
  let lastError: Error;
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < options.maxRetries && isRetryable(lastError)) {
        const delay = options.baseDelay * Math.pow(2, attempt);
        options.onRetry?.(attempt + 1, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}

function isRetryable(error: Error): boolean {
  // 429 (rate limit), 5xx (server error), network errors → retryable
  // 401 (auth), 400 (bad request) → not retryable
  return true; // Simplified
}
```

---

## 11. Security Considerations

| Concern             | Mitigation                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **API key storage** | Stored encrypted in Tauri's app data directory; never in frontend code                                                |
| **Shell injection** | All `bash` commands require user approval; command is displayed before execution                                      |
| **File access**     | Deno server runs with user's permissions; Tauri fs plugin enforces scope                                              |
| **WebView CSP**     | `connect-src` restricted to localhost + DeepSeek API; no arbitrary network access                                     |
| **XSS**             | All AI-generated content rendered through markdown sanitizer; code blocks use `<open-code-block>` with text-only copy |
| **Supply chain**    | Deno server compiled as single binary with no runtime dependencies; Tauri uses audited Rust crates                    |

---

## 12. Implementation Order (Phases)

### Phase 1: Core Protocol (Week 1)

1. Create `packages/protocols/` with all interfaces
2. Write conformance tests
3. Implement `deno-server/src/providers/deepseek.ts` (no tools yet)
4. Implement `deno-server/src/router.ts` (health, sessions, simple chat)
5. Build `deno-server` as standalone binary → verify HTTP API works with curl

### Phase 2: Tool System (Week 2)

1. Implement tool registry + `ToolContext`
2. Implement core tools: `read_file`, `write_file`, `bash`, `grep`, `glob`
3. Implement agent loop with tool calling
4. Test end-to-end: user message → agent → tool call → agent → response

### Phase 3: Frontend Shell (Week 2-3)

1. Create `www/` with base HTML + `<claw-app>` shell
2. Implement `<status-bar>`, `<chat-input>`
3. Implement `<chat-thread>` + `<chat-message>` with markdown
4. SSE streaming display in real-time

### Phase 4: Tauri Integration (Week 3)

1. Set up Tauri shell, Cargo workspace
2. Implement sidecar lifecycle management
3. Implement fs commands
4. Wire up IPC: Tauri → sidecar port → frontend fetch

### Phase 5: Rich UI (Week 4)

1. `<ide-panel>` with resizable split panes
2. `<file-tree>` with real filesystem
3. `<diff-view>`, `<tool-output>`, `<reasoning-panel>`
4. `<settings-modal>` for API keys and model selection

### Phase 6: Polish + Distribution (Week 5)

1. Cross-platform build pipeline
2. Auto-updater for sidecar binary
3. Session export (markdown)
4. Keyboard shortcuts, command palette
5. Performance optimization (virtual scrolling for long conversations)

---

## Appendix A: Tool Catalog

| Tool         | Inputs                                                     | Output                    | Permissions | Approval                 |
| ------------ | ---------------------------------------------------------- | ------------------------- | ----------- | ------------------------ |
| `read_file`  | `path: string`                                             | File content as string    | filesystem  | Always allow             |
| `write_file` | `path: string`, `content: string`                          | Success/error             | filesystem  | Per-file                 |
| `edit_file`  | `path: string`, `old_string: string`, `new_string: string` | Success + diff display    | filesystem  | Per-file                 |
| `bash`       | `command: string`, `timeout?: number`                      | stdout, stderr, exit code | shell       | Each command             |
| `grep`       | `pattern: string`, `path?: string`, `include?: string`     | Array of matches          | filesystem  | Always allow             |
| `glob`       | `pattern: string`, `path?: string`                         | Array of file paths       | filesystem  | Always allow             |
| `list_dir`   | `path: string`, `depth?: number`                           | File tree                 | filesystem  | Always allow             |
| `git_diff`   | `staged?: boolean`                                         | Git diff output           | shell       | Always allow (read-only) |
| `web_fetch`  | `url: string`, `extract_main?: boolean`                    | HTML/markdown content     | network     | Each URL                 |

## Appendix B: Default Models

| Provider             | Model ID                   | Context | Notes                                        |
| -------------------- | -------------------------- | ------- | -------------------------------------------- |
| DeepSeek (primary)   | `deepseek-v3-0324`         | 128K    | Best for general coding                      |
| DeepSeek             | `deepseek-r1`              | 64K     | Reasoning model, `reasoning_content` support |
| OpenAI (fallback)    | `gpt-4o`                   | 128K    | Strong code generation                       |
| Anthropic (fallback) | `claude-sonnet-4-20250514` | 200K    | Best for large codebases                     |
