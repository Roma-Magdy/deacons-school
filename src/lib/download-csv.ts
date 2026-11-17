/** Browser-only: saves rows as a CSV file that Excel opens correctly, Arabic included. */

/** A cell that starts with = or @ (or +/- followed by a letter) would be run as a formula by Excel, so it gets a leading apostrophe. */
function safeCell(value: string): string {
  const v = /^[=@\t\r]/.test(value) || /^[+-]\D/.test(value) ? `'${value}` : value;
  return `"${v.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const body = rows.map((row) => row.map(safeCell).join(",")).join("\r\n");
  // The BOM makes Excel read the Arabic text correctly.
  const blob = new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
