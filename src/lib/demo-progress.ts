import { useEffect, useRef, useState } from "react";
import type { AttemptInput } from "./data";

export type DemoProgress = {
  attempts: (AttemptInput & { date: string })[];
  assessments: { skillId: string; score: number; total: number; date: string }[];
  lastLesson: string | null;
  startUnit: string | null;
};

const key = "dr-percentile-demo-v1";
export const emptyProgress: DemoProgress = {
  attempts: [],
  assessments: [],
  lastLesson: null,
  startUnit: null,
};
export const day = () => new Date().toISOString().slice(0, 10);

function read(): DemoProgress {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...emptyProgress, ...JSON.parse(saved) } : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

export function useDemoProgress() {
  const [progress, setProgress] = useState(emptyProgress);
  const latest = useRef(emptyProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    latest.current = read();
    setProgress(latest.current);
    setReady(true);
  }, []);

  function update(change: (previous: DemoProgress) => DemoProgress) {
    const next = change(latest.current);
    latest.current = next;
    setProgress(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }

  return { progress, ready, update, storageError };
}
