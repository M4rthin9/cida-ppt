"use client";

import { useEffect, useRef } from "react";
import type { Category } from "@/lib/vocational/types";
import type { SettingValue } from "@/lib/settings/registry";
import type { SequenceManifest } from "@/lib/vocational/sequence";
import { frameUrl } from "@/lib/vocational/sequence";
import { CinematicHero } from "./CinematicHero";
import { ApertureSection } from "./ApertureSection";

/** The film is the opening. Static HTML stays readable before enhancement. */
export function CraftJourney({
  hero,
  reveal,
  categories,
  copy,
}: {
  hero?: SequenceManifest;
  reveal?: SequenceManifest;
  categories: Category[];
  copy: SettingValue<"home">;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      element.dataset.motion = motion.matches ? "off" : "on";
    };
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);
  const joined = Boolean(hero && reveal);
  return (
    <div
      ref={root}
      className="v-journey v-journey-opening"
      data-join={joined ? "on" : "off"}
      data-motion="off"
    >
      <CinematicHero sequence={hero} copy={copy} joined={joined} />
      <ApertureSection
        sequence={reveal}
        still={hero ? frameUrl(hero, hero.count - 1) : undefined}
        categories={categories}
        copy={copy}
        joined={joined}
      />
    </div>
  );
}
