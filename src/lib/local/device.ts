const KEY = "barostat-device-id";

export function getDeviceId(): string {
  if (typeof localStorage === "undefined") return "server";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `dev-${Date.now()}`;
  localStorage.setItem(KEY, id);
  return id;
}
