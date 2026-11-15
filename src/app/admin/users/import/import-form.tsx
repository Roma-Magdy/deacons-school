"use client";

import { useState, useTransition } from "react";
import { gradeLabel, text } from "@/lib/strings";
import { IMPORT_CHUNK_SIZE } from "@/lib/import-parse.mjs";
import { toLocalPhone } from "@/lib/phone.mjs";
import Credentials from "../../_components/credentials";
import { importChunk, previewImport, type Credential, type ImportPreview } from "../actions";

const t = text.admin.import;

type Kind = "kid" | "servant";
type Skipped = { name: string; phone: string; reason: string };

export default function ImportForm() {
  const [kind, setKind] = useState<Kind>("kid");
  const [pasted, setPasted] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [checking, startChecking] = useTransition();

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ created: Credential[]; skipped: Skipped[] } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const importing = progress !== null && result === null;

  function reset() {
    setPasted("");
    setPreview(null);
    setProgress(null);
    setResult(null);
    setFailure(null);
  }

  function check() {
    setPreview(null);
    setFailure(null);
    startChecking(async () => {
      try {
        setPreview(await previewImport(pasted, kind));
      } catch {
        setFailure(text.admin.errors.generic);
      }
    });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPasted(await file.text());
    setPreview(null);
  }

  async function runImport() {
    if (!preview || preview.rows.length === 0) return;
    const rows = preview.rows.map(({ name, phone, gender, grade }) => ({ name, phone, gender, grade }));
    const created: Credential[] = [];
    const skipped: Skipped[] = [];
    setFailure(null);
    setProgress({ done: 0, total: rows.length });

    try {
      for (let i = 0; i < rows.length; i += IMPORT_CHUNK_SIZE) {
        const out = await importChunk(kind, rows.slice(i, i + IMPORT_CHUNK_SIZE));
        created.push(...out.created);
        skipped.push(...out.skipped);
        setProgress({ done: Math.min(i + IMPORT_CHUNK_SIZE, rows.length), total: rows.length });
      }
    } catch {
      // Whatever was saved before the failure is still shown, so those passwords aren't lost.
      setFailure(text.admin.errors.generic);
    }
    setResult({ created, skipped });
  }

  if (result) {
    return (
      <section className="staff-card stack">
        <h2>{t.doneTitle}</h2>
        <p>{t.doneCount(result.created.length)}</p>
        <p className="muted">{t.note}</p>
        {failure && (
          <p className="error" role="alert">
            {failure}
          </p>
        )}
        {result.created.length > 0 && <Credentials items={result.created} />}
        {result.skipped.length > 0 && (
          <>
            <h3>{t.skippedTitle}</h3>
            <ul className="problem-list">
              {result.skipped.map((s) => (
                <li key={s.phone}>
                  <strong>{s.name}</strong> <span dir="ltr">{s.phone}</span> — {s.reason}
                </li>
              ))}
            </ul>
          </>
        )}
        <button type="button" className="button" onClick={reset}>
          {t.again}
        </button>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="form staff-card">
        <p className="muted">{t.intro}</p>

        <fieldset className="field radios">
          <legend>{t.kindLabel}</legend>
          <label>
            <input
              type="radio"
              name="kind"
              checked={kind === "kid"}
              onChange={() => {
                setKind("kid");
                setPreview(null);
              }}
            />{" "}
            {t.kindKid}
          </label>
          <label>
            <input
              type="radio"
              name="kind"
              checked={kind === "servant"}
              onChange={() => {
                setKind("servant");
                setPreview(null);
              }}
            />{" "}
            {t.kindServant}
          </label>
        </fieldset>

        <p className="muted">{kind === "kid" ? t.exampleKid : t.exampleServant}</p>

        <label className="field">
          <span>{t.pasteLabel}</span>
          <textarea
            value={pasted}
            onChange={(e) => {
              setPasted(e.target.value);
              setPreview(null);
            }}
            rows={8}
            dir="ltr"
            spellCheck={false}
          />
        </label>

        <label className="field">
          <span>{t.fileLabel}</span>
          <input type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>

        <button type="button" className="button" onClick={check} disabled={checking || importing || pasted.trim() === ""}>
          {checking ? t.checking : t.check}
        </button>

        {failure && (
          <p className="error" role="alert">
            {failure}
          </p>
        )}
      </section>

      {preview && (
        <section className="staff-card stack">
          {preview.rows.length === 0 && preview.errors.length === 0 && <p>{t.nothing}</p>}

          {preview.errors.length > 0 && (
            <>
              <h3 className="error-title">{t.problemCount(preview.errors.length)}</h3>
              <ul className="problem-list">
                {preview.errors.map((er, i) => (
                  <li key={i}>
                    <span className="muted">{t.line(er.line)}</span> {er.name && <strong>{er.name}</strong>} — {er.message}
                  </li>
                ))}
              </ul>
            </>
          )}

          {preview.rows.length > 0 && (
            <>
              <h3>{t.readyCount(preview.rows.length)}</h3>
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.phone}>
                        <td>{r.name}</td>
                        <td dir="ltr">{toLocalPhone(r.phone)}</td>
                        <td>{r.grade ? gradeLabel(r.grade) : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="button" onClick={runImport} disabled={importing}>
                {progress ? t.importing(progress.done, progress.total) : t.importNow(preview.rows.length)}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
