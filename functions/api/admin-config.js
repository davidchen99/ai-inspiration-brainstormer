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

function adminToken(env) {
  return env.AI_BRAINSTORM_ADMIN_TOKEN || env.ADMIN_TOKEN || "";
}

function bearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : request.headers.get("x-admin-token") || "";
}

function requireAdmin(request, env) {
  const expected = adminToken(env);
  if (!expected) {
    return jsonResponse({
      ok: false,
      code: "ADMIN_TOKEN_NOT_CONFIGURED",
      message: "Cloudflare 环境变量 AI_BRAINSTORM_ADMIN_TOKEN 尚未配置。"
    }, { status: 503 });
  }
  if (bearerToken(request) !== expected) {
    return jsonResponse({
      ok: false,
      code: "UNAUTHORIZED",
      message: "管理员后端令牌无效。"
    }, { status: 401 });
  }
  return null;
}

async function readConfig(env) {
  const kv = env.AI_BRAINSTORM_CONFIG;
  if (!kv) return { config: sanitizeConfig(DEFAULT_CONFIG), source: "default", kvReady: false };
  const saved = await kv.get(CONFIG_KEY, { type: "json" });
  if (!saved) return { config: sanitizeConfig(DEFAULT_CONFIG), source: "default", kvReady: true };
  return { config: sanitizeConfig(saved), source: "kv", kvReady: true };
}

export async function onRequestGet({ request, env }) {
  const blocked = requireAdmin(request, env);
  if (blocked) return blocked;
  const result = await readConfig(env);
  return jsonResponse({
    ok: true,
    source: result.source,
    kvReady: result.kvReady,
    config: result.config
  });
}

export async function onRequestPost({ request, env }) {
  const blocked = requireAdmin(request, env);
  if (blocked) return blocked;
  const kv = env.AI_BRAINSTORM_CONFIG;
  if (!kv) {
    return jsonResponse({
      ok: false,
      code: "CONFIG_KV_NOT_BOUND",
      message: "Cloudflare KV 绑定 AI_BRAINSTORM_CONFIG 尚未配置。"
    }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse({
      ok: false,
      code: "INVALID_JSON",
      message: "请求体必须是 JSON。"
    }, { status: 400 });
  }

  const config = sanitizeConfig({
    ...body,
    updatedAt: new Date().toISOString()
  });
  await kv.put(CONFIG_KEY, JSON.stringify(config));
  return jsonResponse({
    ok: true,
    source: "kv",
    kvReady: true,
    config
  });
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}
