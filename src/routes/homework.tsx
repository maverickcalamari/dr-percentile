import { FractionDivisionReview } from "@/components/app/FractionDivisionReview";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/app/SiteHeader";
import { Professor } from "@/components/app/Professor";
import { Button } from "@/components/ui/button";

type Homework = { id: string; name: string; file: Blob; notes: string; reviewed: boolean };
const maxFileBytes = 15 * 1024 * 1024;

function access<T>(mode: IDBTransactionMode, use: (store: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    const open = indexedDB.open("dr-percentile-homework", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("homework", { keyPath: "id" });
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error("Close other homework tabs and try again."));
    open.onsuccess = () => {
      const db = open.result;
      try {
        const transaction = db.transaction("homework", mode);
        const request = use(transaction.objectStore("homework"));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error);
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

async function fileType(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const start = new TextDecoder("ascii").decode(bytes);
  if (start.startsWith("%PDF-")) return "application/pdf";
  if (bytes[0] === 137 && start.slice(1, 4) === "PNG") return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (start.startsWith("RIFF") && start.slice(8) === "WEBP") return "image/webp";
  return null;
}

export const Route = createFileRoute("/homework")({ component: HomeworkPage });

function HomeworkPage() {
  const [entries, setEntries] = useState<Homework[]>([]);
  const [selected, setSelected] = useState<string>();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const entry = entries.find((item) => item.id === selected);

  useEffect(() => {
    let active = true;
    access("readonly", (store) => store.getAll()).then(
      (rows) => {
        if (active) {
          setEntries(rows as Homework[]);
          setReady(true);
        }
      },
      () => {
        if (active) setError("Homework storage is unavailable in this browser.");
      },
    );
    return () => {
      active = false;
    };
  }, []);

  async function change(action: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      await action();
    } catch {
      setError(
        "The browser could not save this change. Check the available storage and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <section className="classroom-card space-y-4">
        <div className="flex items-center gap-3">
          <Professor size={70} className="rounded-full" />
          <h1 className="font-display text-4xl font-bold text-primary">Homework review</h1>
        </div>
        <p>
          Select a math worksheet or a photo. Preview it, make review notes, and mark it reviewed.
          Files and notes stay in this browser and may be visible to others who use the same browser
          profile.
        </p>
        <label className="grid gap-2 font-semibold">
          Add homework (PDF, JPG, PNG, or WebP, up to 15 MB)
          <input
            type="file"
            className="max-w-full text-sm"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            disabled={!ready || busy}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              void change(async () => {
                if (file.size > maxFileBytes) {
                  setError("Choose a file that is 15 MB or smaller.");
                  return;
                }
                const type = await fileType(file);
                if (!type) {
                  setError("Choose a valid PDF, JPG, PNG, or WebP file.");
                  return;
                }
                if (entries.length >= 10) {
                  setError("Remove a saved file before adding more than 10.");
                  return;
                }
                const record = {
                  id: crypto.randomUUID(),
                  name: file.name,
                  file: file.slice(0, file.size, type),
                  notes: "",
                  reviewed: false,
                };
                await access("readwrite", (store) => store.add(record));
                setEntries((previous) => [...previous, record]);
                setSelected(record.id);
                setStatus("Homework added.");
              });
            }}
          />
        </label>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <p role="status">{status || (!ready && !error ? "Loading your homework…" : "")}</p>
      </section>
      {entries.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_2fr]">
          <aside className="classroom-card">
            <h2 className="text-xl font-bold">Saved homework</h2>
            <ul className="mt-3 grid gap-2">
              {entries.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={item.id === selected}
                    onClick={() => setSelected(item.id)}
                    className="w-full break-all rounded-lg bg-primary-soft p-2 text-left text-primary"
                  >
                    {item.name}{" "}
                    <span className="block text-sm">
                      {item.reviewed ? "Reviewed" : "To review"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          {entry && (
            <Review
              key={entry.id}
              entry={entry}
              busy={busy}
              save={(notes, reviewed) =>
                change(async () => {
                  const updated = { ...entry, notes, reviewed };
                  await access("readwrite", (store) => store.put(updated));
                  setEntries((previous) =>
                    previous.map((item) => (item.id === entry.id ? updated : item)),
                  );
                  setStatus("Review saved.");
                })
              }
              remove={() =>
                change(async () => {
                  await access("readwrite", (store) => store.delete(entry.id));
                  setEntries((previous) => previous.filter((item) => item.id !== entry.id));
                  setSelected(undefined);
                  setStatus("Homework removed from this browser.");
                })
              }
            />
          )}
        </div>
      )}
      <FractionDivisionReview />
    </PageShell>
  );
}

function Review({
  entry,
  busy,
  save,
  remove,
}: {
  entry: Homework;
  busy: boolean;
  save: (notes: string, reviewed: boolean) => Promise<void>;
  remove: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(entry.notes);
  const [reviewed, setReviewed] = useState(entry.reviewed);
  const [url, setUrl] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const localUrl = URL.createObjectURL(entry.file);
    setUrl(localUrl);
    return () => URL.revokeObjectURL(localUrl);
  }, [entry.file]);

  return (
    <section className="classroom-card min-w-0 space-y-4">
      <h2 className="break-all text-xl font-bold">{entry.name}</h2>
      {url &&
        (entry.file.type === "application/pdf" ? (
          <iframe
            className="h-80 w-full rounded-lg border"
            src={url}
            title="Homework PDF preview"
          />
        ) : (
          <img
            className="mx-auto max-h-96 max-w-full rounded-lg object-contain"
            src={url}
            alt="Selected homework worksheet"
          />
        ))}
      {url && (
        <a
          className="font-semibold text-primary underline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open file in a new tab
        </a>
      )}
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void save(notes, reviewed);
        }}
      >
        <label className="grid gap-1 font-semibold">
          Review notes
          <textarea
            rows={4}
            maxLength={2000}
            className="rounded-lg border p-2 font-normal"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(event) => setReviewed(event.target.checked)}
          />{" "}
          Mark reviewed
        </label>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy}>Save review</Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm(true)}>
            Remove homework
          </Button>
        </div>
        {confirm && (
          <div className="flex flex-wrap items-center gap-2">
            <p>Remove this file and its notes from this browser?</p>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              Confirm removal
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
