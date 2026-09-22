"use client";
import { useActionState, useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaManager } from "./MediaManager";
import { saveCategory, saveProduct, saveNews } from "@/lib/vocational/actions";
import { categoryInput, productInput, newsInput } from "@/lib/vocational/validation";
import {
  CATEGORY_STATUSES,
  PRODUCT_STATUSES,
  PRICE_MODES,
  STOCK_STATUSES,
  type MediaItem,
  type ActionState,
} from "@/lib/vocational/types";
import { slugify } from "@/lib/slug";

type Field = {
  key: string;
  label: string;
  type?: "textarea" | "checkbox" | "number" | "select" | "media" | "datetime-local";
  options?: Record<string, string>;
  required?: boolean;
  multiple?: boolean;
  hint?: string;
};
type Section = { title: string; fields: Field[] };
type Kind = "product" | "category" | "news";
const f = (
  key: string,
  label: string,
  type?: Field["type"],
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const naming = [
  f("name_th", "ชื่อภาษาไทย", undefined, { required: true }),
  f("name_en", "ชื่อภาษาอังกฤษ"),
  f("slug", "ลิงก์ (slug)", undefined, { required: true }),
];
const descriptions = [
  f("short_description_th", "คำอธิบายสั้นภาษาไทย", "textarea"),
  f("short_description_en", "คำอธิบายสั้นภาษาอังกฤษ", "textarea"),
  f("description_th", "รายละเอียดภาษาไทย", "textarea"),
  f("description_en", "รายละเอียดภาษาอังกฤษ", "textarea"),
];
const seo = {
  title: "ข้อมูลสำหรับการค้นหา (SEO)",
  fields: [f("seo_title", "ชื่อหน้า"), f("seo_description", "คำอธิบายหน้า", "textarea")],
};
function sections(kind: Kind, categories: { id: string; name_th: string }[]): Section[] {
  if (kind === "category")
    return [
      { title: "ข้อมูลหมวดหมู่", fields: naming },
      { title: "เรื่องราวและคำอธิบาย", fields: descriptions },
      {
        title: "ภาพและไอคอน",
        fields: [
          f("cover_image", "ภาพปกหมวดหมู่", "media"),
          f("thumbnail_image", "ภาพย่อ", "media"),
          f("icon_media_id", "ภาพไอคอน", "media"),
          f("icon", "สัญลักษณ์", "select", {
            options: {
              wreath: "พวงหรีด",
              material: "วัสดุ",
              flower: "ดอกไม้",
              textile: "สิ่งทอ",
              craft: "งานฝีมือ",
            },
          }),
        ],
      },
      {
        title: "การแสดงผล",
        fields: [
          f("status", "สถานะ", "select", { options: CATEGORY_STATUSES }),
          f("display_order", "ลำดับแสดงผล", "number"),
          f("is_enabled", "เปิดใช้งานหมวดหมู่", "checkbox"),
          f("is_featured", "หมวดหมู่แนะนำ", "checkbox"),
        ],
      },
      seo,
    ];
  if (kind === "news")
    return [
      {
        title: "ข่าวและกิจกรรมงานฝึกวิชาชีพ",
        fields: [
          f("title", "หัวข้อ", undefined, { required: true }),
          f("slug", "ลิงก์ (slug)", undefined, { required: true }),
          f("type", "ประเภท", "select", {
            options: { news: "ข่าวงานฝึกวิชาชีพ", event: "กิจกรรม / นิทรรศการ" },
          }),
          f("excerpt", "บทนำ", "textarea"),
          f("description", "เนื้อหา", "textarea"),
        ],
      },
      {
        title: "ภาพประกอบ",
        fields: [
          f("cover_image", "ภาพปก", "media"),
          f("media_ids", "แกลเลอรี", "media", { multiple: true }),
        ],
      },
      {
        title: "การเผยแพร่",
        fields: [
          f("is_published", "เผยแพร่ข่าว", "checkbox"),
          f("published_at", "วันเวลาเผยแพร่", "datetime-local", {
            hint: "แสดงตามเวลาของเครื่อง หากกำหนดเวลาในอนาคต ข่าวจะเผยแพร่เมื่อถึงเวลา",
          }),
        ],
      },
      seo,
    ];
  return [
    {
      title: "ข้อมูลสินค้า",
      fields: [
        ...naming,
        f("sku", "รหัสสินค้า (SKU)"),
        f("category_id", "หมวดหมู่", "select", {
          options: Object.fromEntries(categories.map((c) => [c.id, c.name_th])),
          required: true,
        }),
      ],
    },
    { title: "รายละเอียดและทักษะเบื้องหลังผลงาน", fields: descriptions },
    {
      title: "ภาพสินค้า",
      fields: [f("media_ids", "แกลเลอรีสินค้า · ภาพแรกเป็นภาพปก", "media", { multiple: true })],
    },
    {
      title: "ข้อมูลชิ้นงาน",
      fields: [
        f("materials", "วัสดุ"),
        f("dimensions", "ขนาด"),
        f("weight", "น้ำหนัก (กิโลกรัม)", "number"),
      ],
    },
    {
      title: "ราคา",
      fields: [
        f("price_mode", "รูปแบบราคา", "select", { options: PRICE_MODES }),
        f("price", "ราคาปกติ (บาท)", "number"),
        f("sale_price", "ราคาพิเศษ (บาท)", "number"),
      ],
    },
    {
      title: "การผลิตและสต็อก",
      fields: [
        f("stock_status", "ความพร้อมสินค้า", "select", { options: STOCK_STATUSES }),
        f("quantity", "จำนวนคงเหลือ (เว้นว่างเมื่อไม่ติดตาม)", "number"),
        f("made_to_order", "ผลิตตามคำสั่งซื้อ", "checkbox"),
        f("lead_time", "ระยะเวลาผลิต"),
      ],
    },
    {
      title: "การเผยแพร่",
      fields: [
        f("status", "สถานะ", "select", { options: PRODUCT_STATUSES }),
        f("display_order", "ลำดับแสดงผล", "number"),
        f("is_featured", "สินค้าแนะนำบนหน้าแรก", "checkbox"),
        f("is_new", "สินค้าใหม่", "checkbox"),
      ],
    },
    seo,
  ];
}
export function ContentEditor({
  kind,
  id = null,
  defaults = {},
  categories = [],
  media = [],
}: {
  kind: Kind;
  id?: string | null;
  defaults?: Record<string, unknown>;
  categories?: { id: string; name_th: string }[];
  media?: MediaItem[];
}) {
  const router = useRouter(),
    groups = sections(kind, categories);
  const [data, setData] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      groups
        .flatMap((g) => g.fields)
        .map((f) => [
          f.key,
          defaults[f.key] ??
            (f.type === "checkbox"
              ? f.key === "is_enabled"
              : f.type === "media"
                ? f.multiple
                  ? []
                  : null
                : f.key === "display_order"
                  ? 0
                  : f.key === "price_mode"
                    ? "contact"
                    : f.type === "select"
                      ? (Object.keys(f.options ?? {})[0] ?? "")
                      : ""),
        ]),
    ),
  );
  const [dirty, setDirty] = useState(false),
    [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const save = kind === "product" ? saveProduct : kind === "category" ? saveCategory : saveNews;
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(save.bind(null, id), {});
  const errors = { ...state.errors, ...localErrors };
  useEffect(() => {
    // Keep server rendering deterministic, then show the instant in the
    // administrator's local time rather than shifting it on each save.
    if (kind !== "news" || !defaults.published_at) return;
    const date = new Date(String(defaults.published_at));
    if (Number.isNaN(date.getTime())) return;
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setData((prev) => ({ ...prev, published_at: local }));
  }, [kind, defaults.published_at]);
  useEffect(() => {
    if (state.ok) {
      setDirty(false);
      if (!id && state.id)
        router.replace(
          `/admin/${kind === "category" ? "categories" : kind === "product" ? "products" : "news"}/${state.id}?saved=1`,
        );
      router.refresh();
    }
  }, [state, id, kind, router]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (
        a?.href &&
        a.origin === location.origin &&
        a.href !== location.href &&
        !confirm("มีข้อมูลที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  function change(key: string, value: unknown) {
    setDirty(true);
    setLocalErrors({});
    setData((prev) => {
      const next = { ...prev, [key]: value };
      if (
        (key === "name_th" || key === "title") &&
        !id &&
        (!prev.slug || prev.slug === slugify(String(prev[key] ?? "")))
      )
        next.slug = slugify(String(value));
      if (key === "price_mode" && !["exact", "from"].includes(String(value))) {
        next.price = "";
        next.sale_price = "";
      }
      return next;
    });
  }
  return (
    <form
      className="cms-editor"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const schema =
          kind === "product" ? productInput : kind === "category" ? categoryInput : newsInput;
        const payload = { ...data };
        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          setLocalErrors(
            Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
          );
          document.getElementById(String(parsed.error.issues[0]?.path[0]))?.focus();
          return;
        }
        if (kind === "news" && payload.published_at)
          payload.published_at = new Date(String(payload.published_at)).toISOString();
        setLocalErrors({});
        const form = new FormData();
        form.set("payload", JSON.stringify(payload));
        startTransition(() => dispatch(form));
      }}
    >
      <div className="cms-editor-main">
        {groups.map((group) => (
          <section key={group.title} className="cms-panel">
            <h2>{group.title}</h2>
            <div className="cms-fields">
              {group.fields.map((field) => {
                const v = data[field.key],
                  error = errors[field.key];
                if (field.type === "media")
                  return (
                    <div key={field.key} className="cms-wide">
                      <MediaManager
                        label={field.label}
                        initial={media}
                        value={
                          field.multiple
                            ? Array.isArray(v)
                              ? (v as string[])
                              : []
                            : typeof v === "string" && v
                              ? [v]
                              : []
                        }
                        onChange={(ids) =>
                          change(field.key, field.multiple ? ids : (ids[0] ?? null))
                        }
                        multiple={field.multiple ?? false}
                      />
                      {error && (
                        <p className="cms-error" role="alert">
                          {error}
                        </p>
                      )}
                    </div>
                  );
                if (field.type === "checkbox")
                  return (
                    <label key={field.key} className="cms-check">
                      <input
                        id={field.key}
                        name={field.key}
                        type="checkbox"
                        checked={Boolean(v)}
                        onChange={(e) => change(field.key, e.target.checked)}
                      />
                      {field.label}
                    </label>
                  );
                const props = {
                  id: field.key,
                  name: field.key,
                  "aria-invalid": Boolean(error),
                  "aria-describedby": error ? `${field.key}-error` : undefined,
                  required: field.required,
                  value: typeof v === "string" || typeof v === "number" ? v : "",
                  onChange: (
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                    >,
                  ) => change(field.key, e.target.value),
                };
                return (
                  <div key={field.key} className={field.type === "textarea" ? "cms-wide" : ""}>
                    <label htmlFor={field.key}>
                      {field.label}
                      {field.required && <span aria-hidden="true"> *</span>}
                    </label>
                    {field.type === "select" ? (
                      <select {...props}>
                        {field.required && <option value="">เลือกหมวดหมู่</option>}
                        {Object.entries(field.options ?? {}).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea {...props} rows={field.key.startsWith("description") ? 7 : 3} />
                    ) : (
                      <input
                        {...props}
                        type={field.type ?? "text"}
                        step={
                          field.type === "number"
                            ? ["quantity", "display_order"].includes(field.key)
                              ? 1
                              : field.key === "weight"
                                ? 0.001
                                : 0.01
                            : undefined
                        }
                        min={field.type === "number" ? 0 : undefined}
                        disabled={
                          ["price", "sale_price"].includes(field.key) &&
                          !["exact", "from"].includes(String(data.price_mode))
                        }
                      />
                    )}
                    {field.hint && <small>{field.hint}</small>}
                    {error && (
                      <p id={`${field.key}-error`} className="cms-error" role="alert">
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <aside className="cms-save">
        <strong>{id ? "แก้ไขข้อมูล" : "รายการใหม่"}</strong>
        <p>บันทึกแล้วข้อมูลจะปรากฏตามสถานะการเผยแพร่ที่เลือก</p>
        <button type="submit" className="cms-primary" disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
        </button>
        <span role="status">{dirty ? "มีการเปลี่ยนแปลงที่ยังไม่บันทึก" : ""}</span>
        {state.message && (
          <p
            role={state.ok ? "status" : "alert"}
            className={state.ok ? "cms-success" : "cms-error"}
          >
            {state.message}
          </p>
        )}
        {Object.keys(localErrors).length > 0 && (
          <p role="alert" className="cms-error">
            กรุณาตรวจสอบช่องที่แจ้งข้อผิดพลาด
          </p>
        )}
      </aside>
    </form>
  );
}
