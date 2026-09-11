# Logout su tablet condiviso

## Comportamento

Il pulsante **Esci** (client):

1. Tenta un **flush** di tutte le partite locali verso `/api/sync`.
2. Se il flush fallisce **oppure** restano eventi in coda → mostra un `confirm` che spiega il rischio di perdita dati.
3. Solo dopo conferma (o se la coda è vuota) esegue `clearLocalData()`:
   - elimina il database IndexedDB `barostat-24`
   - rimuove `barostat-device-id` da `localStorage`
4. Poi chiama `signOut` Auth.js e reindirizza a `/login`.

## Perché

Su un iPad di squadra il prossimo account non deve ereditare partite, coda sync e device id: altrimenti potrebbe scrivere sotto la nuova sessione con dati dell’utente precedente.

## Verifica manuale

1. Crea una partita, registra un canestro, metti offline, Esci → conferma il warning, rientra con altro account → elenco vuoto / device id nuovo.
2. Online con coda vuota → Esci senza warning → storage pulito.
