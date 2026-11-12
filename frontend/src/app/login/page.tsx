import type { Metadata } from "next";
import { Suspense } from "react";

import { Mark } from "@/components/shell/wordmark";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

async function Form({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  return <LoginForm next={next} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    // Covers the app shell: nothing behind sign-in is reachable or shown from here.
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background p-4">
      <div className="floating w-full max-w-sm rounded-xl p-6 sm:p-8">
        <Mark className="size-8" />
        <h1 className="mt-5 text-xl font-semibold tracking-tight">Sign in to TechOpps</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">A private workspace for the opportunities you track.</p>
        <Suspense>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
