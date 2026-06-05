import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const emptyDb = () => ({
  users: [],
  messages: [],
  verifiers: [],
  timeline: [],
  votes: [],
  sessions: {},
});

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readDb() {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    const db = emptyDb();
    await writeDb(db);
    return db;
  }
}

async function writeDb(db) {
  await ensureDataDir();
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export async function createUser({ name, email, stellarPublicKey }) {
  const db = await readDb();
  const existing = db.users.find((u) => u.email === email);
  if (existing) return existing;

  const user = {
    id: uuid(),
    name,
    email,
    stellarPublicKey: stellarPublicKey || undefined,
    plan: 'free',
    subscriptionExpiresAt: null,
    subscriptionTxHash: null,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    inactivityDays: 30,
  };
  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function getUserById(id) {
  const db = await readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function updateUser(id, patch) {
  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...patch };
  await writeDb(db);
  return db.users[idx];
}

export async function createSession(userId) {
  const token = uuid();
  const db = await readDb();
  db.sessions[token] = { userId, createdAt: new Date().toISOString() };
  await writeDb(db);
  return token;
}

export async function getUserBySession(token) {
  if (!token) return null;
  const db = await readDb();
  const session = db.sessions[token];
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) ?? null;
}

export async function createMessage(userId, data) {
  const db = await readDb();
  const message = {
    id: uuid(),
    userId,
    title: data.title,
    recipient: data.recipient,
    bodyEncrypted: data.bodyEncrypted,
    contentHash: data.contentHash,
    stellarTxHash: data.stellarTxHash,
    messageKind: data.messageKind || 'text',
    attachmentEncrypted: data.attachmentEncrypted || undefined,
    attachmentName: data.attachmentName || undefined,
    attachmentMime: data.attachmentMime || undefined,
    type: data.type || 'individual',
    status: data.status || 'draft',
    createdAt: new Date().toISOString(),
  };
  db.messages.push(message);
  await addTimeline(db, {
    userId,
    messageId: message.id,
    type: 'message_created',
    label: `Message created: ${message.title}`,
    stellarTxHash: data.stellarTxHash,
  });
  await writeDb(db);
  return message;
}

export async function updateMessage(id, userId, patch) {
  const db = await readDb();
  const idx = db.messages.findIndex((m) => m.id === id && m.userId === userId);
  if (idx === -1) return null;
  db.messages[idx] = { ...db.messages[idx], ...patch };
  await writeDb(db);
  return db.messages[idx];
}

export async function getMessagesByUser(userId) {
  const db = await readDb();
  return db.messages.filter((m) => m.userId === userId);
}

export async function getMessageById(id) {
  const db = await readDb();
  return db.messages.find((m) => m.id === id) ?? null;
}

export async function createVerifier(userId, data) {
  const db = await readDb();
  const verifier = {
    id: uuid(),
    userId,
    name: data.name,
    email: data.email,
    relationship: data.relationship,
    stellarAddress: data.stellarAddress,
    priority: data.priority ?? 1,
  };
  db.verifiers.push(verifier);
  await writeDb(db);
  return verifier;
}

export async function getVerifiersByUser(userId) {
  const db = await readDb();
  return db.verifiers.filter((v) => v.userId === userId);
}

export async function deleteVerifier(id, userId) {
  const db = await readDb();
  const before = db.verifiers.length;
  db.verifiers = db.verifiers.filter((v) => !(v.id === id && v.userId === userId));
  if (db.verifiers.length === before) return false;
  await writeDb(db);
  return true;
}

export async function addTimeline(dbOrNull, event) {
  const db = dbOrNull ?? (await readDb());
  const entry = {
    id: uuid(),
    userId: event.userId,
    messageId: event.messageId,
    type: event.type,
    label: event.label,
    stellarTxHash: event.stellarTxHash,
    meta: event.meta,
    createdAt: new Date().toISOString(),
  };
  db.timeline.push(entry);
  if (!dbOrNull) await writeDb(db);
  return entry;
}

export async function getTimelineByUser(userId) {
  const db = await readDb();
  return db.timeline
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function recordVote(messageId, verifierId, confirmed, stellarTxHash) {
  const db = await readDb();
  const message = db.messages.find((m) => m.id === messageId);
  const verifier = db.verifiers.find((v) => v.id === verifierId);
  if (!message || !verifier) return null;

  const existing = db.votes.find(
    (v) => v.messageId === messageId && v.verifierId === verifierId,
  );
  if (existing) {
    existing.confirmed = confirmed;
    existing.stellarTxHash = stellarTxHash;
    existing.createdAt = new Date().toISOString();
  } else {
    db.votes.push({
      id: uuid(),
      messageId,
      verifierId,
      confirmed,
      stellarTxHash,
      createdAt: new Date().toISOString(),
    });
  }

  await addTimeline(db, {
    userId: message.userId,
    messageId,
    type: 'verifier_vote',
    label: `${verifier.name} voted ${confirmed ? 'confirm' : 'reject'} inactivity`,
    stellarTxHash,
    meta: verifierId,
  });
  await writeDb(db);
  return db.votes.filter((v) => v.messageId === messageId);
}

export async function getVotesForMessage(messageId) {
  const db = await readDb();
  return db.votes.filter((v) => v.messageId === messageId);
}

export async function checkDeliveryConsensus(messageId) {
  const db = await readDb();
  const message = db.messages.find((m) => m.id === messageId);
  if (!message) return { ready: false, reason: 'Message not found' };

  const verifiers = db.verifiers.filter((v) => v.userId === message.userId);
  if (verifiers.length === 0) {
    return { ready: false, reason: 'No verifiers configured' };
  }

  const votes = db.votes.filter((v) => v.messageId === messageId && v.confirmed);
  const threshold = Math.ceil(verifiers.length / 2);
  const ready = votes.length >= threshold;

  return {
    ready,
    votes: votes.length,
    threshold,
    totalVerifiers: verifiers.length,
  };
}

export async function deliverMessage(messageId, stellarTxHash) {
  const db = await readDb();
  const idx = db.messages.findIndex((m) => m.id === messageId);
  if (idx === -1) return null;

  db.messages[idx].status = 'delivered';
  db.messages[idx].deliveredAt = new Date().toISOString();

  await addTimeline(db, {
    userId: db.messages[idx].userId,
    messageId,
    type: 'message_delivered',
    label: `Message delivered to ${db.messages[idx].recipient}`,
    stellarTxHash,
  });
  await writeDb(db);
  return db.messages[idx];
}

export async function recordActivityPing(userId, stellarTxHash) {
  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  db.users[idx].lastActivityAt = now;

  await addTimeline(db, {
    userId,
    type: 'activity_ping',
    label: 'Activity check-in recorded on Stellar',
    stellarTxHash,
  });
  await writeDb(db);
  return db.users[idx];
}

export async function activatePremium(userId, { stellarTxHash, expiresAt }) {
  const db = await readDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  db.users[idx].plan = 'premium';
  db.users[idx].subscriptionExpiresAt = expiresAt;
  db.users[idx].subscriptionTxHash = stellarTxHash;

  await addTimeline(db, {
    userId,
    type: 'subscription_activated',
    label: 'Premium annual subscription activated',
    stellarTxHash,
    meta: expiresAt,
  });
  await writeDb(db);
  return db.users[idx];
}

export async function findUserBySubscriptionTx(txHash) {
  const db = await readDb();
  return db.users.find((u) => u.subscriptionTxHash === txHash) ?? null;
}

export async function getPortalMessage(messageId, verifierEmail) {
  const db = await readDb();
  const message = db.messages.find((m) => m.id === messageId);
  if (!message) return null;

  const verifier = db.verifiers.find(
    (v) => v.userId === message.userId && v.email === verifierEmail,
  );
  if (!verifier) return null;

  const owner = db.users.find((u) => u.id === message.userId);
  const votes = db.votes.filter((v) => v.messageId === messageId);

  return {
    message: {
      id: message.id,
      title: message.title,
      recipient: message.recipient,
      status: message.status,
      contentHash: message.contentHash,
      stellarTxHash: message.stellarTxHash,
      createdAt: message.createdAt,
      deliveredAt: message.deliveredAt,
    },
    owner: owner ? { name: owner.name, lastActivityAt: owner.lastActivityAt } : null,
    verifier: { id: verifier.id, name: verifier.name },
    votes,
    bodyEncrypted: message.status === 'delivered' ? message.bodyEncrypted : undefined,
  };
}
