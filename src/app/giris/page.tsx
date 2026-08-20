import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Giriş",
};

export default function GirisPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-3xl mb-6">Giriş Yap</h1>
        <LoginForm />
      </div>
    </main>
  );
}
