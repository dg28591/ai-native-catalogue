import { useEffect, useState } from "react";

export type Resource<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

type ResourceLoader<T> = (key: string) => Promise<T>;

export function useResource<T>(key: string, load: ResourceLoader<T>) {
  const [resource, setResource] = useState<Resource<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setResource({ status: "loading" });

    load(key)
      .then((data) => {
        if (active) setResource({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Unable to load this page.";
        setResource({ status: "error", message });
      });

    return () => {
      active = false;
    };
  }, [attempt, key, load]);

  return { resource, retry: () => setAttempt((current) => current + 1) };
}