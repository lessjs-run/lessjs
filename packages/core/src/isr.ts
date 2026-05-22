/**
 * @lessjs/core - route-level ISR cache primitives.
 *
 * v0.21: Full ISR consumption — MemoryIsrCache for dev/tests,
 * RedisIsrCache for production (zero npm deps, raw TCP RESP protocol).
 *
 * Architecture:
 *   1. Build: SSG produces static HTML + isr-manifest.json
 *   2. Runtime: Production handler checks cache before serving static
 *   3. Regeneration: miss → render → cache → serve; stale → serve old + async rebuild
 */

export type IsrCacheState = 'miss' | 'hit' | 'stale' | 'error';

export interface IsrCacheEntry {
  html: string;
  createdAt: number;
  revalidate: number;
  headers?: Record<string, string>;
}

export interface IsrCacheResult {
  state: IsrCacheState;
  entry?: IsrCacheEntry;
  error?: Error;
}

export interface IsrCache {
  get(key: string, now?: number): Promise<IsrCacheResult> | IsrCacheResult;
  set(key: string, entry: IsrCacheEntry): Promise<void> | void;
  delete?(key: string): Promise<void> | void;
}

export interface IsrRouteConfig {
  revalidate: number;
}

export function isIsrRouteConfig(value: unknown): value is IsrRouteConfig {
  return typeof value === 'object' && value !== null &&
    typeof (value as IsrRouteConfig).revalidate === 'number' &&
    Number.isFinite((value as IsrRouteConfig).revalidate) &&
    (value as IsrRouteConfig).revalidate > 0;
}

export function createIsrCacheKey(
  routePath: string,
  params: Record<string, string> = {},
): string {
  const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const suffix = sortedParams.length === 0 ? '' : '?' +
    sortedParams.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  return `lessjs:isr:${routePath}${suffix}`;
}

/** ISR route record written to isr-manifest.json at build time. */
export interface IsrManifestEntry {
  path: string;
  revalidate: number;
  cacheKey: string;
  params: Record<string, string>;
}

// ═══ Memory Cache (tests / dev) ═══════════════════════════════

export class MemoryIsrCache implements IsrCache {
  readonly #entries = new Map<string, IsrCacheEntry>();

  get(key: string, now = Date.now()): IsrCacheResult {
    const entry = this.#entries.get(key);
    if (!entry) return { state: 'miss' };
    const ageSeconds = Math.max(0, Math.floor((now - entry.createdAt) / 1000));
    return {
      state: ageSeconds >= entry.revalidate ? 'stale' : 'hit',
      entry,
    };
  }

  set(key: string, entry: IsrCacheEntry): void {
    this.#entries.set(key, entry);
  }

  delete(key: string): void {
    this.#entries.delete(key);
  }
}

// ═══ Redis Cache (production) ═════════════════════════════════
// Zero npm dependencies — raw TCP with RESP protocol.
// Supports host/port/password/prefix configuration.
// Connects lazily, reconnects on broken pipe.

class RespWriter {
  #buf = '';
  cmd(...args: string[]): this {
    this.#buf += `*${args.length}\r\n`;
    for (const arg of args) this.#buf += `$${arg.length}\r\n${arg}\r\n`;
    return this;
  }
  bytes(): Uint8Array {
    return new TextEncoder().encode(this.#buf);
  }
  reset(): void {
    this.#buf = '';
  }
}

class RespReader {
  #text = '';
  feed(chunk: string): void {
    this.#text += chunk;
  }
  read(): { type: string; value: string | number | null } | null {
    const idx = this.#text.indexOf('\r\n');
    if (idx === -1) return null;
    const line = this.#text.slice(0, idx);
    this.#text = this.#text.slice(idx + 2);
    const prefix = line[0];
    const rest = line.slice(1);
    switch (prefix) {
      case '+':
        return { type: 'simple', value: rest };
      case '-':
        return { type: 'error', value: rest };
      case ':':
        return { type: 'integer', value: parseInt(rest, 10) };
      case '$': {
        const len = parseInt(rest, 10);
        if (len === -1) return { type: 'bulk', value: null };
        if (this.#text.length < len + 2) return null; // incomplete
        const data = this.#text.slice(0, len);
        this.#text = this.#text.slice(len + 2);
        return { type: 'bulk', value: data };
      }
      default:
        return null;
    }
  }
}

export class RedisIsrCache implements IsrCache {
  #host: string;
  #port: number;
  #password?: string;
  #prefix: string;
  #conn: Deno.TcpConn | null = null;
  #reader = new RespReader();
  #buf = new Uint8Array(4096);

  constructor(opts: {
    host?: string;
    port?: number;
    password?: string;
    prefix?: string;
  } = {}) {
    this.#host = opts.host || '127.0.0.1';
    this.#port = opts.port || 6379;
    this.#password = opts.password;
    this.#prefix = opts.prefix || 'lessjs:isr:';
  }

  async #connect(): Promise<Deno.TcpConn> {
    if (this.#conn) {
      try {
        this.#conn.remoteAddr;
        return this.#conn;
      } catch {
        this.#conn = null;
      }
    }
    this.#conn = await Deno.connect({ hostname: this.#host, port: this.#port });
    this.#reader = new RespReader();
    if (this.#password) await this.#execCmd('AUTH', this.#password);
    return this.#conn;
  }

  async #execCmd(...args: string[]): Promise<string | null> {
    const conn = await this.#connect();
    const writer = new RespWriter();
    writer.cmd(...args);
    await conn.write(writer.bytes());
    while (true) {
      const n = await conn.read(this.#buf);
      if (n === null) throw new Error('Redis connection closed');
      this.#reader.feed(new TextDecoder().decode(this.#buf.slice(0, n)));
      const result = this.#reader.read();
      if (result !== null) {
        if (result.type === 'error') throw new Error(`Redis: ${result.value}`);
        return result.value as string | null;
      }
    }
  }

  async get(key: string, now = Date.now()): Promise<IsrCacheResult> {
    try {
      const raw = await this.#execCmd('GET', this.#prefix + key);
      if (raw === null) return { state: 'miss' };
      const entry = JSON.parse(raw) as IsrCacheEntry;
      const ageSeconds = Math.max(0, Math.floor((now - entry.createdAt) / 1000));
      return { state: ageSeconds >= entry.revalidate ? 'stale' : 'hit', entry };
    } catch (e) {
      return { state: 'error', error: e instanceof Error ? e : new Error(String(e)) };
    }
  }

  async set(key: string, entry: IsrCacheEntry): Promise<void> {
    await this.#execCmd(
      'SET',
      this.#prefix + key,
      JSON.stringify(entry),
      'EX',
      String(entry.revalidate),
    );
  }

  async delete(key: string): Promise<void> {
    await this.#execCmd('DEL', this.#prefix + key);
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.#execCmd('PING')) === 'PONG';
    } catch {
      return false;
    }
  }
}
