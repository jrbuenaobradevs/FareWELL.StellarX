"use client";

import { useCallback, useState } from "react";

const TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, fallback: T, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function useWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const freighter = await import("@stellar/freighter-api");
      const connected = await withTimeout(freighter.isConnected(), {
        isConnected: false,
      });
      if (!connected.isConnected) {
        throw new Error("Freighter not detected. Install from freighter.app");
      }
      const access = await freighter.requestAccess();
      if (access.error) throw new Error(access.error);
      if (!access.address) throw new Error("Wallet access denied");
      setPublicKey(access.address);
      return access.address;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect";
      setError(msg);
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
  }, []);

  return { publicKey, connecting, error, connect, disconnect };
}
