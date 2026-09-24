import { Link } from "@/i18n/navigation";
import type { SettingValue } from "@/lib/settings/registry";
import { splitLines } from "./Lines";
export function StorySection({ copy }: { copy: SettingValue<"home"> }) {
  const steps = splitLines(copy.storySteps).map((line) => {
    const [title = "", ...rest] = line.split("|");
    return [title.trim(), rest.join("|").trim()];
  });
  return (
    <section className="v-story" id="story">
      <div>
        {copy.storyEyebrow && <p className="v-eyebrow">{copy.storyEyebrow}</p>}
        <h2>
          {copy.storyTitle}
          {copy.storyTitleAccent && (
            <>
              <br />
              <span>{copy.storyTitleAccent}</span>
            </>
          )}
        </h2>
        {copy.storyBody && <p>{copy.storyBody}</p>}
        <Link className="v-text-link" href="/story">
          {copy.storyCta} ↗
        </Link>
      </div>
      {steps.length > 0 && (
        <ol>
          {steps.map(([title, text], i) => (
            <li key={i}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                {text && <p>{text}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
