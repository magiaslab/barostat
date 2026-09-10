type SyncPillProps = {
  lastOk: boolean | null;
  pending: number;
};

export function SyncPill({ lastOk, pending }: SyncPillProps) {
  const synced = lastOk === true && pending === 0;
  return (
    <span className="syncpill">
      <i className={synced ? "dot on" : "dot off"} aria-hidden />
      <span>{synced ? "Sincronizzato" : "Offline · salvato sul tablet"}</span>
    </span>
  );
}
