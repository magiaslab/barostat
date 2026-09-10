export function vibrate(ms: number): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // alcuni WebView lanciano se vibrate non è supportato
  }
}
