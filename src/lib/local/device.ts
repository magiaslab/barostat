const KEY = "barostat-device-id";

/**
 * Sentinella non persistibile: indica che siamo in un contesto senza
 * `localStorage` (SSR / test Node). Non va mai scritta su disco né usata
 * come recorderDeviceId reale.
 */
export const SSR_DEVICE_ID = "__ssr__";

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

/**
 * Crea o legge l'id dispositivo. Solo browser con `localStorage`.
 * In SSR restituisce `SSR_DEVICE_ID` senza mintare né persistire nulla.
 */
export function ensureDeviceId(): string {
  if (typeof localStorage === "undefined") {
    return SSR_DEVICE_ID;
  }
  const existing = readDeviceId();
  if (existing) return existing;
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `dev-${Date.now()}`;
  localStorage.setItem(KEY, id);
  emit();
  return id;
}

export function clearDeviceId(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
  emit();
}

/** True se l'id è usabile come registratore locale (non SSR). */
export function isPersistableDeviceId(id: string): boolean {
  return id !== "" && id !== SSR_DEVICE_ID;
}
