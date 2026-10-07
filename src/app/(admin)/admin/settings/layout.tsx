import { AdminSettingsTabs } from "@/components/admin/AdminNavigation";
import { requireOwner } from "@/lib/auth/session";
import { SETTINGS, SETTING_KEYS } from "@/lib/settings/registry";

export const metadata = { title: "ตั้งค่า" };

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ตั้งค่า</h1>

      <AdminSettingsTabs
        items={SETTING_KEYS.map((key) => ({
          href: `/admin/settings/${key}`,
          label: SETTINGS[key].label,
        }))}
      />

      {children}
    </div>
  );
}
