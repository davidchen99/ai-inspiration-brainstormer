const CONFIG_KEY = "runtime-config";

const DEFAULT_CONFIG = {
  version: 1,
  onlineKnowledge: {
    enabled: true,
    allowFolder: true,
    maxFiles: 80,
    maxTotalChars: 1000000,
    maxPromptChars: 14000,
    maxSectionChars: 1400
  }
};

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json;charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

function positiveInt(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < min) return fallback;
  return Math.min(max, number);
}

function sanitizeConfig(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const knowledge = source.onlineKnowledge && typeof source.onlineKnowledge === "object"
    ? source.onlineKnowledge
    : {};
  return {
    version: 1,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : "",
    onlineKnowledge: {
      enabled: knowledge.enabled !== false,
      allowFolder: knowledge.allowFolder !== false,
      maxFiles: positiveInt(knowledge.maxFiles, DEFAULT_CONFIG.onlineKnowledge.maxFiles, 1, 5000),
      maxTotalChars: positiveInt(knowledge.maxTotalChars, DEFAULT_CONFIG.onlineKnowledge.maxTotalChars, 10000, 20000000),
      maxPromptChars: positiveInt(knowledge.maxPromptChars, DEFAULT_CONFIG.onlineKnowledge.maxPromptChars, 1000, 100000),
      maxSectionChars: positiveInt(knowledge.maxSectionChars, DEFAULT_CONFIG.onlineKnowledge.maxSectionChars, 300, 10000)
    }
  };
}

async function readConfig(env) {
  const kv = env.AI_BRAINSTORM_CONFIG;
  if (!kv) return { config: sanitizeConfig(DEFAULT_CONFIG), source: "default", kvReady: false };
  const saved = await kv.get(CONFIG_KEY, { type: "json" });
  if (!saved) return { config: sanitizeConfig(DEFAULT_CONFIG), source: "default", kvReady: true };
  return { config: sanitizeConfig(saved), source: "kv", kvReady: true };
}

export async function onRequestGet({ env }) {
  const result = await readConfig(env);
  return jsonResponse({
    ok: true,
    source: result.source,
    kvReady: result.kvReady,
    config: result.config
  });
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}
