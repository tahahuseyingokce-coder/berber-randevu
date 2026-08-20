"use client";

import { useState, useTransition } from "react";
import { signInAction } from "./actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInAction({ email, password });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        E-posta
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        />
      </label>

      <label className="grid gap-1 text-sm">
        Şifre
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-4 py-2 outline-none focus:border-accent"
        />
      </label>

      {error && <p className="text-danger text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium disabled:opacity-40"
      >
        {isPending ? "Giriş yapılıyor…" : "Giriş Yap"}
      </button>
    </form>
  );
}
