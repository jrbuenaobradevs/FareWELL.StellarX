import './env.js';
import express from 'express';
import cors from 'cors';
import {
  createUser,
  createSession,
  getUserBySession,
  updateUser,
  createMessage,
  updateMessage,
  getMessagesByUser,
  getMessageById,
  createVerifier,
  getVerifiersByUser,
  deleteVerifier,
  getTimelineByUser,
  recordVote,
  getVotesForMessage,
  checkDeliveryConsensus,
  deliverMessage,
  recordActivityPing,
  getPortalMessage,
  addTimeline,
  activatePremium,
  findUserBySubscriptionTx,
} from './store.js';
import {
  planLimitsForUser,
  assertCanAddRecipient,
  assertCanAddVerifier,
  assertMessageAllowed,
  assertActivityInterval,
} from './plans.js';
import {
  verifyPremiumPayment,
  subscriptionExpiresAtOneYear,
  getPaymentConfig,
} from './subscriptions.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  getUserBySession(token).then((user) => {
    if (!user) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    req.user = user;
    req.token = token;
    next();
  });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'farewell-api' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, stellarPublicKey } = req.body;
    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    const user = await createUser({ name: name.trim(), email: email.trim().toLowerCase(), stellarPublicKey });
    const token = await createSession(user.id);
    res.json({ user, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const user = await createUser({ name: email.split('@')[0], email: email.trim().toLowerCase() });
    const token = await createSession(user.id);
    res.json({ user, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user });
});

app.patch('/api/me', auth, async (req, res) => {
  try {
    const { name, stellarPublicKey, inactivityDays } = req.body;
    if (inactivityDays !== undefined) {
      assertActivityInterval(req.user, inactivityDays);
    }
    const user = await updateUser(req.user.id, {
      ...(name !== undefined && { name }),
      ...(stellarPublicKey !== undefined && { stellarPublicKey }),
      ...(inactivityDays !== undefined && { inactivityDays: Number(inactivityDays) }),
    });
    res.json({ user });
  } catch (e) {
    const status = e.code?.startsWith('PLAN_') ? 403 : 500;
    res.status(status).json({ error: e.message, code: e.code });
  }
});

app.get('/api/plans', (_req, res) => {
  res.json(getPaymentConfig());
});

app.get('/api/subscription', auth, async (req, res) => {
  const messages = await getMessagesByUser(req.user.id);
  const verifiers = await getVerifiersByUser(req.user.id);
  res.json(planLimitsForUser(req.user, messages, verifiers));
});

app.post('/api/subscription/activate', auth, async (req, res) => {
  try {
    const { stellarTxHash } = req.body;
    if (!stellarTxHash) {
      res.status(400).json({ error: 'stellarTxHash required' });
      return;
    }

    const existing = await findUserBySubscriptionTx(stellarTxHash);
    if (existing && existing.id !== req.user.id) {
      res.status(409).json({ error: 'Transaction already used for subscription' });
      return;
    }

    const verification = await verifyPremiumPayment(
      stellarTxHash,
      req.user.stellarPublicKey,
    );
    if (!verification.ok) {
      res.status(400).json({ error: verification.error });
      return;
    }

    const expiresAt = subscriptionExpiresAtOneYear();
    const user = await activatePremium(req.user.id, { stellarTxHash, expiresAt });
    res.json({ user, subscription: planLimitsForUser(user, [], []) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Testnet demo: activate premium without USDC (development only) */
app.post('/api/subscription/demo-activate', auth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not available' });
    return;
  }
  try {
    const expiresAt = subscriptionExpiresAtOneYear();
    const user = await activatePremium(req.user.id, {
      stellarTxHash: `demo-${Date.now()}`,
      expiresAt,
    });
    const messages = await getMessagesByUser(user.id);
    const verifiers = await getVerifiersByUser(user.id);
    res.json({ user, subscription: planLimitsForUser(user, messages, verifiers), demo: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/messages', auth, async (req, res) => {
  const messages = await getMessagesByUser(req.user.id);
  res.json({ messages });
});

app.post('/api/messages', auth, async (req, res) => {
  try {
    const {
      title,
      recipient,
      bodyEncrypted,
      contentHash,
      type,
      stellarTxHash,
      messageKind,
      attachmentEncrypted,
      attachmentName,
      attachmentMime,
    } = req.body;
    if (!title || !recipient || !bodyEncrypted || !contentHash) {
      res.status(400).json({ error: 'Missing required message fields' });
      return;
    }

    const messages = await getMessagesByUser(req.user.id);
    assertCanAddRecipient(req.user, messages, recipient);
    assertMessageAllowed(req.user, {
      messageKind: messageKind || 'text',
      attachmentEncrypted,
    });

    const message = await createMessage(req.user.id, {
      title,
      recipient,
      bodyEncrypted,
      contentHash,
      type,
      messageKind,
      attachmentEncrypted,
      attachmentName,
      attachmentMime,
      status: stellarTxHash ? 'active' : 'draft',
      stellarTxHash,
    });
    if (stellarTxHash) {
      await addTimeline(null, {
        userId: req.user.id,
        messageId: message.id,
        type: 'message_anchored',
        label: `Hash anchored on Stellar testnet`,
        stellarTxHash,
      });
    }
    res.status(201).json({ message });
  } catch (e) {
    const status = e.code?.startsWith('PLAN_') ? 403 : 500;
    res.status(status).json({ error: e.message, code: e.code });
  }
});

app.patch('/api/messages/:id', auth, async (req, res) => {
  try {
    const message = await updateMessage(req.params.id, req.user.id, req.body);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/messages/:id', auth, async (req, res) => {
  const message = await getMessageById(req.params.id);
  if (!message || message.userId !== req.user.id) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }
  const votes = await getVotesForMessage(message.id);
  res.json({ message, votes });
});

app.get('/api/verifiers', auth, async (req, res) => {
  const verifiers = await getVerifiersByUser(req.user.id);
  res.json({ verifiers });
});

app.post('/api/verifiers', auth, async (req, res) => {
  try {
    const verifiers = await getVerifiersByUser(req.user.id);
    assertCanAddVerifier(req.user, verifiers);
    const verifier = await createVerifier(req.user.id, req.body);
    res.status(201).json({ verifier });
  } catch (e) {
    const status = e.code?.startsWith('PLAN_') ? 403 : 500;
    res.status(status).json({ error: e.message, code: e.code });
  }
});

app.delete('/api/verifiers/:id', auth, async (req, res) => {
  const ok = await deleteVerifier(req.params.id, req.user.id);
  if (!ok) {
    res.status(404).json({ error: 'Verifier not found' });
    return;
  }
  res.json({ ok: true });
});

app.get('/api/timeline', auth, async (req, res) => {
  const timeline = await getTimelineByUser(req.user.id);
  res.json({ timeline });
});

app.post('/api/activity/ping', auth, async (req, res) => {
  try {
    const { stellarTxHash } = req.body;
    const user = await recordActivityPing(req.user.id, stellarTxHash);
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/messages/:id/votes', async (req, res) => {
  try {
    const { verifierId, confirmed, stellarTxHash, verifierEmail } = req.body;
    const message = await getMessageById(req.params.id);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    let vid = verifierId;
    if (!vid && verifierEmail) {
      const verifiers = await getVerifiersByUser(message.userId);
      const v = verifiers.find((x) => x.email === verifierEmail);
      if (!v) {
        res.status(403).json({ error: 'Verifier not authorized' });
        return;
      }
      vid = v.id;
    }

    const votes = await recordVote(req.params.id, vid, Boolean(confirmed), stellarTxHash);
    res.json({ votes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/messages/:id/consensus', auth, async (req, res) => {
  const consensus = await checkDeliveryConsensus(req.params.id);
  res.json(consensus);
});

app.post('/api/messages/:id/deliver', auth, async (req, res) => {
  try {
    const consensus = await checkDeliveryConsensus(req.params.id);
    if (!consensus.ready) {
      res.status(400).json({ error: 'Verifier consensus not reached', consensus });
      return;
    }
    const { stellarTxHash } = req.body;
    const message = await deliverMessage(req.params.id, stellarTxHash);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    await addTimeline(null, {
      userId: req.user.id,
      messageId: message.id,
      type: 'delivery_triggered',
      label: 'Delivery triggered on Stellar testnet',
      stellarTxHash,
    });
    res.json({ message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/messages/:id/simulate-delivery', auth, async (req, res) => {
  try {
    const message = await deliverMessage(req.params.id, req.body.stellarTxHash || 'simulated');
    if (!message || message.userId !== req.user.id) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    res.json({ message, simulated: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/portal/:messageId', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    res.status(400).json({ error: 'email query param required' });
    return;
  }
  const portal = await getPortalMessage(req.params.messageId, String(email).toLowerCase());
  if (!portal) {
    res.status(404).json({ error: 'Not found or unauthorized' });
    return;
  }
  res.json(portal);
});

app.listen(PORT, () => {
  console.log(`FareWELL API listening on http://localhost:${PORT}`);
});
