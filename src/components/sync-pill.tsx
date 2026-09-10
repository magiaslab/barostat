type SyncPillProps = {
  lastOk: boolean | null;
  pending: number;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export function SyncPill({
  lastOk,
  pending,
  onRefresh,
  refreshing = false,
}: SyncPillProps) {
  const synced = lastOk === true && pending === 0;
  const label = synced ? "Sincronizzato" : "Offline · salvato sul tablet";
  const body = (
    <>
      <i className={synced ? "dot on" : "dot off"} aria-hidden />
      <span>{label}</span>
    </>
  );

  if (!onRefresh) {
    return <span className="syncpill">{body}</span>;
  }

  return (
    <button
      type="button"
      className="syncpill"
      onClick={onRefresh}
      disabled={refreshing}
      aria-label="Aggiorna le partite"
    >
      {body}
    </button>
  );
}
