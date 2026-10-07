import type { SVGProps } from "react";

const paths = {
  overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  category: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17.5 14v7M14 17.5h7",
  product: "m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5",
  news: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h4M8 18h8",
  media: "M3 3h18v18H3zM3 17l5-5 4 4 4-6 5 7M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0",
  messages: "M4 5h16v12H9l-5 4V5ZM8 9h8M8 13h5",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  history: "M3 11a9 9 0 1 1 2.6 7M3 4v7h7M12 7v5l3 2",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  external: "M7 17 17 7M7 7h10v10",
  menu: "M4 6h16M4 12h16M4 18h16",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 4 4L19 6",
  draft: "M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4",
  archive: "M3 3h18v5H3zM5 8v13h14V8M9 12h6",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  stock: "M12 8v5M12 17h.01M12 3 2 21h20L12 3Z",
  logout: "M9 4H4v16h5M9 12h12m-5-5 5 5-5 5",
} as const;

export type AdminIconName = keyof typeof paths;

export function AdminIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: AdminIconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
