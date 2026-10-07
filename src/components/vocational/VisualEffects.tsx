"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { startVisualEffects } from "@/lib/vocational/visual-effects";

/** Enhance the server-rendered storefront without wrapping or replacing its content. */
export function VisualEffects() {
  const pathname = usePathname();
  useEffect(() => startVisualEffects(document.body), [pathname]);
  return null;
}
