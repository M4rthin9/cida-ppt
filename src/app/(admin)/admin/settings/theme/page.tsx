import { requireOwner } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings/store";
import { saveSettingsAction } from "../actions";
import { ThemeForm } from "./theme-form";

export const metadata = { title: "ธีมและสี" };

export default async function ThemePage() {
  await requireOwner();
  const theme = await getSetting("theme");
  const action = saveSettingsAction.bind(null, "theme");
  return <ThemeForm action={action} defaults={theme} />;
}
