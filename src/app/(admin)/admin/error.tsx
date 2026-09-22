"use client";

import { AdminError } from "@/components/admin/AdminError";

export default function Error({ reset }: { reset: () => void }) {
  return <AdminError reset={reset} />;
}
