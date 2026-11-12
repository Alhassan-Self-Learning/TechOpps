import Link from "next/link";

import { PageFrame } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageFrame className="max-w-xl py-16">
      <p className="tabular text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        This address does not match any page in TechOpps. The opportunity or source may have been merged or deleted.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/">Go to the dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/opportunities">Discover</Link>
        </Button>
      </div>
    </PageFrame>
  );
}
