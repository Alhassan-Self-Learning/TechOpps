"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

import { SourceForm } from "./source-form";

/** "Add source" opens the form in a side sheet; saving goes to the new source's page. */
export function AddSourceButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} aria-haspopup="dialog">
        <Plus aria-hidden /> Add source
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add a source"
        description="New sources start inactive. Nothing is collected until you activate one."
      >
        <SourceForm />
      </Sheet>
    </>
  );
}
