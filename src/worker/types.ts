/** Minimal structural bindings (no @cloudflare/workers-types in this repo; see wrangler.jsonc). */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface AiLike {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface DecorationEnv {
  AI: AiLike;
  DECORATION: KVLike;
}

export interface Env extends Partial<DecorationEnv> {
  ASSETS: { fetch(request: Request): Promise<Response> };
}
