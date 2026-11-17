"use client";

import { useEffect, useState } from "react";

import { healthHealth, healthHealthDb } from "@/lib/api-client";

type Check = { label: string; state: "loading" | "ok" | "error"; detail?: string };

const INITIAL: Check[] = [
  { label: "API (learniverse-api)", state: "loading" },
  { label: "Cơ sở dữ liệu", state: "loading" },
];

/** Connectivity check FE -> /api proxy -> API -> DB (block K1). */
export function ApiStatus() {
  const [checks, setChecks] = useState<Check[]>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([healthHealth(), healthHealthDb()]).then(([api, db]) => {
      if (cancelled) return;
      setChecks([
        api.data
          ? { label: INITIAL[0].label, state: "ok", detail: `${api.data.service} (${api.data.env})` }
          : { label: INITIAL[0].label, state: "error", detail: "Không gọi được API" },
        db.data
          ? { label: INITIAL[1].label, state: "ok", detail: db.data.database }
          : { label: INITIAL[1].label, state: "error", detail: "Không kết nối được cơ sở dữ liệu" },
      ]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ul className="space-y-2">
      {checks.map((c) => (
        <li key={c.label} data-state={c.state} className="flex gap-2">
          <span aria-hidden>{c.state === "ok" ? "✅" : c.state === "error" ? "❌" : "⏳"}</span>
          <span className="font-medium">{c.label}</span>
          {c.detail && <span className="text-gray-500">— {c.detail}</span>}
        </li>
      ))}
    </ul>
  );
}
