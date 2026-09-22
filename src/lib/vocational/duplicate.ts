/** Keep copied names editable within the existing varchar(255) limit. */
export function duplicateProductName(name: string): string {
  if (!name) return "";
  const suffix = " (สำเนา)";
  return `${name.slice(0, 255 - suffix.length).trimEnd()}${suffix}`;
}
