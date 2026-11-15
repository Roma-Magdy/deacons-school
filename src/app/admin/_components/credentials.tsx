"use client";

import { useState } from "react";
import { text } from "@/lib/strings";

type Credential = { name: string; phone: string; password: string };

const t = text.admin.credentials;

/** Newly created accounts with their starting passwords. These are shown once and never stored in readable form. */
export default function Credentials({ items }: { items: Credential[] }) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    // Tab-separated, so it pastes into Excel or WhatsApp as clean columns.
    const body = items.map((c) => [c.name, c.phone, c.password].join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be blocked (for example on plain http); the table can still be selected by hand.
    }
  }

  function download() {
    const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [[t.name, t.phone, t.password].map(quote).join(",")];
    for (const c of items) lines.push([c.name, c.phone, c.password].map(quote).join(","));
    // The BOM makes Excel read the Arabic text correctly.
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accounts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="cred">
      <div className="cred-actions">
        <button type="button" className="button secondary" onClick={copyAll}>
          {copied ? t.copied : t.copyAll}
        </button>
        {items.length > 1 && (
          <button type="button" className="button secondary" onClick={download}>
            {t.download}
          </button>
        )}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t.name}</th>
              <th>{t.phone}</th>
              <th>{t.password}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.phone}>
                <td>{c.name}</td>
                <td dir="ltr">{c.phone}</td>
                <td dir="ltr" className="mono">
                  {c.password}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
