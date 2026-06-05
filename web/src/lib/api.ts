const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("farewell_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

import type { MessageKind, SubscriptionInfo } from "./plans";

export interface User {
  id: string;
  name: string;
  email: string;
  stellarPublicKey?: string;
  plan?: "free" | "premium";
  subscriptionExpiresAt?: string | null;
  subscriptionTxHash?: string | null;
  createdAt: string;
  lastActivityAt?: string;
  inactivityDays?: number;
}

export interface LegacyMessage {
  id: string;
  userId: string;
  title: string;
  recipient: string;
  bodyEncrypted: string;
  contentHash: string;
  stellarTxHash?: string;
  messageKind?: MessageKind;
  attachmentEncrypted?: string;
  attachmentName?: string;
  attachmentMime?: string;
  type: "individual" | "group";
  status: "draft" | "active" | "scheduled" | "delivered";
  createdAt: string;
  deliveredAt?: string;
}

export interface Verifier {
  id: string;
  userId: string;
  name: string;
  email: string;
  relationship: string;
  stellarAddress?: string;
  priority: number;
}

export interface TimelineEvent {
  id: string;
  userId: string;
  messageId?: string;
  type: string;
  label: string;
  stellarTxHash?: string;
  meta?: string;
  createdAt: string;
}

export const api = {
  register: (body: { name: string; email: string; stellarPublicKey?: string }) =>
    request<{ user: User; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (email: string) =>
    request<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  me: () => request<{ user: User }>("/api/me"),

  updateMe: (patch: Partial<User>) =>
    request<{ user: User }>("/api/me", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  messages: () => request<{ messages: LegacyMessage[] }>("/api/messages"),

  createMessage: (body: Partial<LegacyMessage>) =>
    request<{ message: LegacyMessage }>("/api/messages", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  message: (id: string) =>
    request<{ message: LegacyMessage; votes: unknown[] }>(`/api/messages/${id}`),

  consensus: (id: string) =>
    request<{ ready: boolean; votes: number; threshold: number }>(
      `/api/messages/${id}/consensus`,
    ),

  deliver: (id: string, stellarTxHash?: string) =>
    request<{ message: LegacyMessage }>(`/api/messages/${id}/deliver`, {
      method: "POST",
      body: JSON.stringify({ stellarTxHash }),
    }),

  simulateDelivery: (id: string) =>
    request<{ message: LegacyMessage }>(`/api/messages/${id}/simulate-delivery`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  verifiers: () => request<{ verifiers: Verifier[] }>("/api/verifiers"),

  createVerifier: (body: Omit<Verifier, "id" | "userId">) =>
    request<{ verifier: Verifier }>("/api/verifiers", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteVerifier: (id: string) =>
    request<{ ok: boolean }>(`/api/verifiers/${id}`, { method: "DELETE" }),

  timeline: () => request<{ timeline: TimelineEvent[] }>("/api/timeline"),

  activityPing: (stellarTxHash: string) =>
    request<{ user: User }>("/api/activity/ping", {
      method: "POST",
      body: JSON.stringify({ stellarTxHash }),
    }),

  portal: (messageId: string, email: string) =>
    request<{
      message: LegacyMessage;
      owner: { name: string; lastActivityAt?: string } | null;
      verifier: { id: string; name: string };
      votes: unknown[];
      bodyEncrypted?: string;
    }>(`/api/portal/${messageId}?email=${encodeURIComponent(email)}`),

  submitVote: (
    messageId: string,
    body: { verifierEmail: string; confirmed: boolean; stellarTxHash?: string },
  ) =>
    request<{ votes: unknown[] }>(`/api/messages/${messageId}/votes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  subscription: () => request<SubscriptionInfo>("/api/subscription"),

  activateSubscription: (stellarTxHash: string) =>
    request<{ user: User; subscription: SubscriptionInfo }>(
      "/api/subscription/activate",
      { method: "POST", body: JSON.stringify({ stellarTxHash }) },
    ),

  demoActivateSubscription: () =>
    request<{ user: User; subscription: SubscriptionInfo; demo: boolean }>(
      "/api/subscription/demo-activate",
      { method: "POST", body: JSON.stringify({}) },
    ),
};

export function saveSession(token: string, user: User) {
  localStorage.setItem("farewell_token", token);
  localStorage.setItem("farewell_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("farewell_token");
  localStorage.removeItem("farewell_user");
}

export function loadStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("farewell_user");
  return raw ? (JSON.parse(raw) as User) : null;
}
