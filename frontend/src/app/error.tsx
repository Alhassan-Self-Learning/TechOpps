"use client";

import { CircleAlert } from "lucide-react";

import { PageFrame } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageFrame className="max-w-xl py-16">
      <CircleAlert className="size-6 text-danger" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">This page failed to load</h1>
      <p className="mt-2 text-muted-foreground">
        Something went wrong while rendering it. Try again; if it keeps failing, check the web and API logs.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </PageFrame>
  );
}
