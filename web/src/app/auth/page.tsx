"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isRegister = params.get("mode") === "register";
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, isRegister ? name : undefined);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <span>🌌</span> FareWELL
        </Link>
        <h1 className="text-2xl font-bold">
          {isRegister ? "Create account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isRegister
            ? "Start building your verifiable digital legacy."
            : "Sign in with your email to continue."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link href="/auth" className="text-accent hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/auth?mode=register" className="text-accent hover:underline">
                Register
              </Link>
            </>
          )}
        </p>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
