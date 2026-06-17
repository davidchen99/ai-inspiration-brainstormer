const STORE_KEY = "account-store";
const SESSION_PREFIX = "session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_GUEST_LIMIT = 10;
const DEFAULT_INVITE_LIMIT = 20;
const ADMIN_USERNAME = "admin";
const ADMIN_DEFAULT_PASSWORD = "124816";

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

function positiveInt(value, fallback = 0) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return number;
}

function normalizeInviteCode(value) {
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function randomId(prefix) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}-${[...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function passwordHash(password, salt) {
  return sha256(`${salt}:${password}`);
}

async function makeUser({ username, password, role = "user", inviteCode = "", usageLimit = DEFAULT_GUEST_LIMIT, customUsageLimit = false }) {
  const salt = randomId("salt");
  const now = new Date().toISOString();
  return {
    id: role === "admin" ? "admin" : randomId("user"),
    username: String(username || "").trim(),
    passwordHash: await passwordHash(password, salt),
    passwordSalt: salt,
    role,
    inviteCode: normalizeInviteCode(inviteCode),
    usageLimit: role === "admin" ? null : positiveInt(usageLimit, DEFAULT_GUEST_LIMIT),
    customUsageLimit: Boolean(customUsageLimit),
    usedCalls: 0,
    apiCalls: 0,
    tokenUsage: 0,
    createdAt: now,
    lastActiveAt: ""
  };
}

async function createDefaultStore() {
  const now = new Date().toISOString();
  return {
    version: 1,
    settings: {
      guestLimit: DEFAULT_GUEST_LIMIT
    },
    inviteCodes: [],
    users: [
      await makeUser({
        username: ADMIN_USERNAME,
        password: ADMIN_DEFAULT_PASSWORD,
        role: "admin",
        usageLimit: null,
        customUsageLimit: true
      }),
      {
        id: "guest-shared",
        username: "游客用户",
        passwordHash: "",
        passwordSalt: "",
        role: "guest",
        inviteCode: "",
        usageLimit: DEFAULT_GUEST_LIMIT,
        customUsageLimit: false,
        usedCalls: 0,
        apiCalls: 0,
        tokenUsage: 0,
        createdAt: now,
        lastActiveAt: ""
      }
    ]
  };
}

function accountKv(env) {
  return env.AI_BRAINSTORM_ACCOUNTS || null;
}

async function readStore(env) {
  const kv = accountKv(env);
  if (!kv) return { kvReady: false, store: null };
  let store = await kv.get(STORE_KEY, { type: "json" });
  if (!store) {
    store = await createDefaultStore();
    await kv.put(STORE_KEY, JSON.stringify(store));
  }
  return { kvReady: true, store: normalizeStore(store) };
}

async function writeStore(env, store) {
  const kv = accountKv(env);
  if (!kv) throw new Error("AI_BRAINSTORM_ACCOUNTS KV is not bound.");
  await kv.put(STORE_KEY, JSON.stringify(normalizeStore(store)));
}

function normalizeStore(store) {
  const next = {
    version: 1,
    settings: {
      guestLimit: positiveInt(store?.settings?.guestLimit, DEFAULT_GUEST_LIMIT)
    },
    inviteCodes: Array.isArray(store?.inviteCodes) ? store.inviteCodes : [],
    users: Array.isArray(store?.users) ? store.users : []
  };
  next.inviteCodes = next.inviteCodes.map(invite => ({
    code: normalizeInviteCode(invite.code),
    usageLimit: positiveInt(invite.usageLimit, DEFAULT_INVITE_LIMIT),
    note: String(invite.note || ""),
    active: invite.active !== false,
    usedCount: positiveInt(invite.usedCount, 0),
    createdAt: invite.createdAt || new Date().toISOString(),
    updatedAt: invite.updatedAt || ""
  })).filter(invite => invite.code);
  next.users = next.users.map(user => ({
    id: String(user.id || randomId("user")),
    username: String(user.username || "未命名用户").trim(),
    passwordHash: String(user.passwordHash || ""),
    passwordSalt: String(user.passwordSalt || ""),
    role: user.role === "admin" ? "admin" : user.role === "guest" ? "guest" : "user",
    inviteCode: normalizeInviteCode(user.inviteCode || ""),
    usageLimit: user.role === "admin" ? null : positiveInt(user.usageLimit, next.settings.guestLimit),
    customUsageLimit: Boolean(user.customUsageLimit),
    usedCalls: positiveInt(user.usedCalls, 0),
    apiCalls: positiveInt(user.apiCalls, 0),
    tokenUsage: positiveInt(user.tokenUsage, 0),
    createdAt: user.createdAt || new Date().toISOString(),
    lastActiveAt: user.lastActiveAt || ""
  }));
  return next;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    inviteCode: user.inviteCode,
    usageLimit: user.usageLimit,
    customUsageLimit: user.customUsageLimit,
    usedCalls: user.usedCalls,
    apiCalls: user.apiCalls,
    tokenUsage: user.tokenUsage,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt
  };
}

function adminStoreView(store) {
  return {
    version: store.version,
    settings: store.settings,
    inviteCodes: store.inviteCodes,
    users: store.users.map(publicUser)
  };
}

async function createSession(env, user) {
  const kv = accountKv(env);
  const token = randomId("session");
  await kv.put(`${SESSION_PREFIX}${token}`, JSON.stringify({
    userId: user.id,
    role: user.role,
    createdAt: new Date().toISOString()
  }), { expirationTtl: SESSION_TTL_SECONDS });
  return token;
}

function bearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function readSession(env, request, store) {
  const kv = accountKv(env);
  const token = bearerToken(request);
  if (!kv || !token) return null;
  const session = await kv.get(`${SESSION_PREFIX}${token}`, { type: "json" });
  if (!session?.userId) return null;
  const user = store.users.find(row => row.id === session.userId);
  return user ? { token, session, user } : null;
}

async function requireSession(env, request, store) {
  const session = await readSession(env, request, store);
  if (!session) {
    return { error: jsonResponse({ ok: false, code: "UNAUTHORIZED", message: "请先登录。" }, { status: 401 }) };
  }
  return { session };
}

async function requireAdmin(env, request, store) {
  const result = await requireSession(env, request, store);
  if (result.error) return result;
  if (result.session.user.role !== "admin") {
    return { error: jsonResponse({ ok: false, code: "FORBIDDEN", message: "需要管理员权限。" }, { status: 403 }) };
  }
  return result;
}

function capacity(user, store) {
  if (!user || user.role === "admin") return { limit: null, remaining: null, allowed: true };
  const limit = user.role === "guest" && !user.customUsageLimit
    ? store.settings.guestLimit
    : positiveInt(user.usageLimit, store.settings.guestLimit);
  const used = positiveInt(user.usedCalls, 0);
  return { limit, remaining: Math.max(0, limit - used), allowed: used < limit };
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

async function handleStatus(env) {
  const { kvReady } = await readStore(env);
  return jsonResponse({ ok: true, accountBackend: { enabled: kvReady, kvReady } });
}

async function handleSession(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: true, authenticated: false, accountBackend: { enabled: false, kvReady: false } });
  const session = await readSession(env, request, store);
  if (!session) return jsonResponse({ ok: true, authenticated: false, accountBackend: { enabled: true, kvReady: true } });
  return jsonResponse({
    ok: true,
    authenticated: true,
    user: publicUser(session.user),
    capacity: capacity(session.user, store),
    accountBackend: { enabled: true, kvReady: true }
  });
}

async function handleLogin(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: false, code: "ACCOUNT_KV_NOT_BOUND", message: "账号后端 KV 尚未配置。" }, { status: 503 });
  const body = await parseJson(request);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");
  const user = store.users.find(row => row.username.toLowerCase() === username.toLowerCase());
  if (!user || !user.passwordHash || await passwordHash(password, user.passwordSalt) !== user.passwordHash) {
    return jsonResponse({ ok: false, code: "INVALID_CREDENTIALS", message: "账号或密码不正确。" }, { status: 401 });
  }
  user.lastActiveAt = new Date().toISOString();
  await writeStore(env, store);
  const token = await createSession(env, user);
  return jsonResponse({ ok: true, token, user: publicUser(user), capacity: capacity(user, store) });
}

async function handleRegister(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: false, code: "ACCOUNT_KV_NOT_BOUND", message: "账号后端 KV 尚未配置。" }, { status: 503 });
  const body = await parseJson(request);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");
  const inviteCode = normalizeInviteCode(body?.inviteCode || "");
  if (!username || !password) return jsonResponse({ ok: false, code: "INVALID_INPUT", message: "注册账号和密码不能为空。" }, { status: 400 });
  if (store.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return jsonResponse({ ok: false, code: "USERNAME_EXISTS", message: "这个账号名已存在，请换一个。" }, { status: 409 });
  }
  let usageLimit = store.settings.guestLimit;
  if (inviteCode) {
    const invite = store.inviteCodes.find(row => row.code === inviteCode && row.active);
    if (!invite) return jsonResponse({ ok: false, code: "INVALID_INVITE", message: "邀请码不存在或已停用；也可以不填邀请码注册。" }, { status: 400 });
    usageLimit = invite.usageLimit;
    invite.usedCount = positiveInt(invite.usedCount, 0) + 1;
  }
  const user = await makeUser({
    username,
    password,
    role: "user",
    inviteCode,
    usageLimit,
    customUsageLimit: Boolean(inviteCode)
  });
  store.users.push(user);
  await writeStore(env, store);
  const token = await createSession(env, user);
  return jsonResponse({ ok: true, token, user: publicUser(user), capacity: capacity(user, store) });
}

async function handleLogout(env, request) {
  const kv = accountKv(env);
  const token = bearerToken(request);
  if (kv && token) await kv.delete(`${SESSION_PREFIX}${token}`);
  return jsonResponse({ ok: true });
}

async function handleRecordUsage(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: false, code: "ACCOUNT_KV_NOT_BOUND", message: "账号后端 KV 尚未配置。" }, { status: 503 });
  const required = await requireSession(env, request, store);
  if (required.error) return required.error;
  const user = required.session.user;
  const current = capacity(user, store);
  if (!current.allowed) return jsonResponse({ ok: false, code: "USAGE_LIMIT_REACHED", message: "您的使用次数已达上限。", capacity: current }, { status: 429 });
  const body = await parseJson(request);
  user.usedCalls = positiveInt(user.usedCalls, 0) + 1;
  user.apiCalls = positiveInt(user.apiCalls, 0) + positiveInt(body?.apiCalls, 1);
  user.tokenUsage = positiveInt(user.tokenUsage, 0) + positiveInt(body?.tokens, 0);
  user.lastActiveAt = new Date().toISOString();
  await writeStore(env, store);
  return jsonResponse({ ok: true, user: publicUser(user), capacity: capacity(user, store) });
}

async function handleAdminStore(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: false, code: "ACCOUNT_KV_NOT_BOUND", message: "账号后端 KV 尚未配置。" }, { status: 503 });
  const required = await requireAdmin(env, request, store);
  if (required.error) return required.error;
  return jsonResponse({ ok: true, store: adminStoreView(store) });
}

async function handleSaveInvite(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: false, code: "ACCOUNT_KV_NOT_BOUND", message: "账号后端 KV 尚未配置。" }, { status: 503 });
  const required = await requireAdmin(env, request, store);
  if (required.error) return required.error;
  const body = await parseJson(request);
  const oldCode = normalizeInviteCode(body?.oldCode || "");
  const code = normalizeInviteCode(body?.code || "");
  if (!code) return jsonResponse({ ok: false, code: "INVALID_INPUT", message: "邀请码不能为空。" }, { status: 400 });
  if (store.inviteCodes.some(invite => invite.code === code && invite.code !== oldCode)) {
    return jsonResponse({ ok: false, code: "DUPLICATE_INVITE", message: "这个邀请码已经存在。" }, { status: 409 });
  }
  const now = new Date().toISOString();
  const existing = oldCode ? store.inviteCodes.find(invite => invite.code === oldCode) : null;
  if (existing) {
    existing.code = code;
    existing.usageLimit = positiveInt(body?.usageLimit, DEFAULT_INVITE_LIMIT);
    existing.note = String(body?.note || "");
    existing.active = body?.active !== false;
    existing.updatedAt = now;
  } else {
    store.inviteCodes.push({
      code,
      usageLimit: positiveInt(body?.usageLimit, DEFAULT_INVITE_LIMIT),
      note: String(body?.note || ""),
      active: body?.active !== false,
      usedCount: 0,
      createdAt: now,
      updatedAt: ""
    });
  }
  await writeStore(env, store);
  return jsonResponse({ ok: true, store: adminStoreView(store) });
}

async function handleDeleteInvite(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: false, code: "ACCOUNT_KV_NOT_BOUND", message: "账号后端 KV 尚未配置。" }, { status: 503 });
  const required = await requireAdmin(env, request, store);
  if (required.error) return required.error;
  const body = await parseJson(request);
  const code = normalizeInviteCode(body?.code || "");
  store.inviteCodes = store.inviteCodes.filter(invite => invite.code !== code);
  await writeStore(env, store);
  return jsonResponse({ ok: true, store: adminStoreView(store) });
}

async function handleUserLimit(env, request) {
  const { kvReady, store } = await readStore(env);
  if (!kvReady) return jsonResponse({ ok: false, code: "ACCOUNT_KV_NOT_BOUND", message: "账号后端 KV 尚未配置。" }, { status: 503 });
  const required = await requireAdmin(env, request, store);
  if (required.error) return required.error;
  const body = await parseJson(request);
  const user = store.users.find(row => row.id === body?.userId);
  if (!user || user.role === "admin") return jsonResponse({ ok: false, code: "INVALID_USER", message: "用户不存在或不能调整管理员额度。" }, { status: 400 });
  user.usageLimit = positiveInt(body?.usageLimit, store.settings.guestLimit);
  user.customUsageLimit = true;
  await writeStore(env, store);
  return jsonResponse({ ok: true, store: adminStoreView(store) });
}

export async function onRequestGet({ request, env }) {
  const action = new URL(request.url).searchParams.get("action") || "status";
  if (action === "status") return handleStatus(env);
  if (action === "session") return handleSession(env, request);
  if (action === "admin-store") return handleAdminStore(env, request);
  return jsonResponse({ ok: false, code: "UNKNOWN_ACTION", message: "未知账号接口。" }, { status: 404 });
}

export async function onRequestPost({ request, env }) {
  const body = await parseJson(request);
  const action = body?.action || new URL(request.url).searchParams.get("action") || "";
  const clonedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(body || {})
  });
  if (action === "login") return handleLogin(env, clonedRequest);
  if (action === "register") return handleRegister(env, clonedRequest);
  if (action === "logout") return handleLogout(env, clonedRequest);
  if (action === "record-usage") return handleRecordUsage(env, clonedRequest);
  if (action === "save-invite") return handleSaveInvite(env, clonedRequest);
  if (action === "delete-invite") return handleDeleteInvite(env, clonedRequest);
  if (action === "save-user-limit") return handleUserLimit(env, clonedRequest);
  return jsonResponse({ ok: false, code: "UNKNOWN_ACTION", message: "未知账号接口。" }, { status: 404 });
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}
