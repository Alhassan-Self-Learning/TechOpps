"use client";

import { useEffect } from "react";

/** Opens a <details> when the URL points at it (e.g. "Correct details" links from Review). */
export function OpenOnHash({ id }: { id: string }) {
  useEffect(() => {
    const open = () => {
      if (window.location.hash === `#${id}`) {
        const el = document.getElementById(id);
        if (el instanceof HTMLDetailsElement) el.open = true;
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [id]);
  return null;
}
