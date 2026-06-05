export type PlanId = "free" | "premium";
export type MessageKind = "text" | "personalized" | "video";

export const PLAN_COPY = {
  free: {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Get started with digital legacy basics",
    features: [
      "Up to 3 recipients",
      "Text messages only",
      "No file attachments",
      "1 activity check interval (30 days)",
      "1 verification contact",
    ],
  },
  premium: {
    id: "premium" as const,
    name: "Premium",
    price: "$19.99",
    period: "per year",
    tagline: "Full legacy suite with rich media",
    features: [
      "Unlimited recipients",
      "Personalized messages",
      "File attachments",
      "Video farewell messages",
      "Multiple verification contacts",
      "Custom activity check intervals",
    ],
  },
};

export interface SubscriptionInfo {
  plan: PlanId;
  planName: string;
  priceAnnualUsd: number;
  subscriptionExpiresAt: string | null;
  usage: { recipients: number; verifiers: number };
  limits: {
    maxRecipients: number | null;
    maxVerifiers: number | null;
    allowAttachments: boolean;
    allowVideo: boolean;
    allowPersonalized: boolean;
    messageKinds: MessageKind[];
    customActivityInterval: boolean;
    fixedActivityIntervalDays: number | null;
  };
}

export function isPremium(sub: SubscriptionInfo | null): boolean {
  return sub?.plan === "premium";
}
