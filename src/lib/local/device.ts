const KEY = "barostat-device-id";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeDeviceId(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function readDeviceId(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}

export function ensureDeviceId(): string {
  const existing = readDeviceId();
  if (existing) return existing;
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `dev-${Date.now()}`;
  if (typeof localStorage === "undefined") return "server";
  localStorage.setItem(KEY, id);
  emit();
  return id;
}

export function clearDeviceId(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
  emit();
}

