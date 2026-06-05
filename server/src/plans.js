/** @typedef {'free' | 'premium'} PlanId */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceAnnualUsd: 0,
    maxRecipients: 3,
    maxVerifiers: 1,
    allowAttachments: false,
    allowVideo: false,
    allowPersonalized: false,
    messageKinds: ['text'],
    customActivityInterval: false,
    fixedActivityIntervalDays: 30,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceAnnualUsd: 19.99,
    maxRecipients: Infinity,
    maxVerifiers: Infinity,
    allowAttachments: true,
    allowVideo: true,
    allowPersonalized: true,
    messageKinds: ['text', 'personalized', 'video'],
    customActivityInterval: true,
  },
};

export const PREMIUM_PRICE_USD = 19.99;
/** Stellar USDC uses 7 decimal places */
export const PREMIUM_USDC_STROOPS = '199900000';

export function getUserPlan(user) {
  if (!user) return PLANS.free;
  if (user.plan === 'premium' && user.subscriptionExpiresAt) {
    if (new Date(user.subscriptionExpiresAt) > new Date()) {
      return PLANS.premium;
    }
  }
  return PLANS.free;
}

export function countUniqueRecipients(messages) {
  return new Set(messages.map((m) => m.recipient.trim().toLowerCase())).size;
}

export function planLimitsForUser(user, messages, verifiers) {
  const plan = getUserPlan(user);
  const recipientCount = countUniqueRecipients(messages);
  return {
    plan: plan.id,
    planName: plan.name,
    priceAnnualUsd: plan.priceAnnualUsd,
    subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
    usage: {
      recipients: recipientCount,
      verifiers: verifiers.length,
    },
    limits: {
      maxRecipients: plan.maxRecipients === Infinity ? null : plan.maxRecipients,
      maxVerifiers: plan.maxVerifiers === Infinity ? null : plan.maxVerifiers,
      allowAttachments: plan.allowAttachments,
      allowVideo: plan.allowVideo,
      allowPersonalized: plan.allowPersonalized,
      messageKinds: plan.messageKinds,
      customActivityInterval: plan.customActivityInterval,
      fixedActivityIntervalDays: plan.fixedActivityIntervalDays ?? null,
    },
  };
}

export function assertCanAddRecipient(user, messages, newRecipient) {
  const plan = getUserPlan(user);
  if (plan.maxRecipients === Infinity) return;

  const normalized = newRecipient.trim().toLowerCase();
  const existing = new Set(messages.map((m) => m.recipient.trim().toLowerCase()));
  if (existing.has(normalized)) return;

  if (existing.size >= plan.maxRecipients) {
    const err = new Error(
      `Free plan allows up to ${plan.maxRecipients} recipients. Upgrade to Premium for unlimited.`,
    );
    err.code = 'PLAN_LIMIT_RECIPIENTS';
    throw err;
  }
}

export function assertCanAddVerifier(user, verifiers) {
  const plan = getUserPlan(user);
  if (plan.maxVerifiers === Infinity) return;
  if (verifiers.length >= plan.maxVerifiers) {
    const err = new Error(
      `Free plan allows ${plan.maxVerifiers} verification contact. Upgrade to Premium for multiple verifiers.`,
    );
    err.code = 'PLAN_LIMIT_VERIFIERS';
    throw err;
  }
}

export function assertMessageAllowed(user, data) {
  const plan = getUserPlan(user);
  const kind = data.messageKind || 'text';

  if (!plan.messageKinds.includes(kind)) {
    const err = new Error(
      kind === 'video'
        ? 'Video farewell messages require Premium.'
        : kind === 'personalized'
          ? 'Personalized messages require Premium.'
          : 'Message type not allowed on your plan.',
    );
    err.code = 'PLAN_LIMIT_MESSAGE_KIND';
    throw err;
  }

  if (data.attachmentEncrypted && !plan.allowAttachments) {
    const err = new Error('File attachments require Premium.');
    err.code = 'PLAN_LIMIT_ATTACHMENTS';
    throw err;
  }
}

export function assertActivityInterval(user, inactivityDays) {
  const plan = getUserPlan(user);
  if (plan.customActivityInterval) return;
  if (Number(inactivityDays) !== plan.fixedActivityIntervalDays) {
    const err = new Error(
      `Free plan uses a fixed ${plan.fixedActivityIntervalDays}-day activity check interval. Upgrade to Premium to customize.`,
    );
    err.code = 'PLAN_LIMIT_ACTIVITY_INTERVAL';
    throw err;
  }
}
