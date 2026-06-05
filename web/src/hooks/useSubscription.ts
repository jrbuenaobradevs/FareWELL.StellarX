"use client";

import { SubscriptionInfo, isPremium } from "@/lib/plans";
import { api } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const sub = await api.subscription();
      setSubscription(sub);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    subscription,
    loading,
    refresh,
    isPremium: isPremium(subscription),
  };
}
