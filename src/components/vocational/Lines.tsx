import { Fragment } from "react";

/** Operator copy from a textarea, one entry per non-empty line. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Operator copy with its line breaks kept as <br />. */
export function Lines({ text }: { text: string }) {
  return splitLines(text).map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}
