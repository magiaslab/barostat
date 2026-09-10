# Brief operativo per l'agente

Incolla questo messaggio in Cursor come primo prompt della sessione. Le regole in `.cursor/rules/` sono già attive e contengono dominio, stack, design system, offline e autenticazione: **non ripeterle qui, leggile.**

---

Costruiamo **BaroStat 24**, la PWA descritta in `.cursor/rules/00-progetto.mdc`.

Prima di scrivere codice: apri `docs/mockup.html` nel browser e guarda le cinque schermate. È il mockup **approvato** — va tradotto in componenti React, non riprogettato. Poi leggi `docs/concept.md` per le decisioni già prese.

## Ordine di lavoro

Procedi per fasi. **Al termine di ogni fase fermati, mostrami cosa hai fatto e aspetta il via** prima di passare alla successiva. Non anticipare fasi successive "già che ci sei".

Nota sull'ordine: le fasi 1–6 non toccano né database né autenticazione. È voluto — l'app è local-first, quindi deve essere **usabile in una partita vera prima che Neon esista**. Rete e login arrivano dopo, quando c'è già qualcosa da sincronizzare.

### Fase 1 — impalcatura
`create-next-app` con TypeScript, Tailwind, App Router, `src/`. Poi shadcn/ui, i font, i token da `docs/design-tokens.css` in `globals.css` mappati su Tailwind, il manifest PWA. Alla fine: `npm run dev` mostra una pagina vuota col fondo e i font giusti.

### Fase 2 — tipi e statistiche
`src/lib/types.ts` con i tipi del dominio esattamente come li definisce la regola `00-progetto`. `src/lib/stats.ts` con le funzioni pure di derivazione: punti per fascia, totali per periodo e partita, percentuali, tiri liberi. Test Vitest su ognuna, casi limite inclusi (nessun evento, divisione per zero nelle percentuali). Nessuna UI in questa fase.

### Fase 3 — store locale
Dexie: schema, scrittura dell'evento, lettura reattiva, annulla. Un hook `useGameEvents(gameId)` che espone eventi e derivate. **La scrittura in IndexedDB avviene nel gestore del tap, non in un effetto differito**: un ricaricamento non deve perdere nulla.

### Fase 4 — schermata live
È il cuore dell'app: costruiscila per prima fra le UI e curala più di tutte. Griglia 3 fasce × 4 esiti per squadra, la cella che è insieme bottone e contatore, tap +1, pressione lunga −1, annulla globale, pillole dei quarti, toggle Quarto/Partita, indicatore dello stato dei dati.

Verifica su due misure prima di dichiararla finita: **1180×820 (tablet orizzontale, layout primario) e 390×844 (telefono)**. In entrambe la schermata sta intera senza scroll.

### Fase 5 — elenco partite e nuova partita
Elenco con risultato, esito V/S e mini-barra della distribuzione per fascia. Form nuova partita: avversario, data, casa/trasferta, competizione. Tutto ancora su Dexie.

### Fase 6 — riepilogo ed export
Riepilogo con la frase-sintesi generata dai dati, il grafico di confronto per fascia (barre in CSS, nessuna libreria), le tabelle per quarto. Poi i tre export:
- **testo** negli appunti, formattato per il gruppo WhatsApp dello staff;
- **CSV**, un evento per riga;
- **PDF**, una pagina A4 con grafico e tabelle.

Ogni formato mostra un'anteprima prima di produrre il file, come nel mockup.

### Fase 7 — accesso
Auth.js v5 con Google ristretto al dominio Workspace, secondo `.cursor/rules/40-auth.mdc`. Chiedimi il valore di `GOOGLE_WORKSPACE_DOMAIN`, non inventarlo.

### Fase 8 — Neon e sincronizzazione
Schema Drizzle, migrazioni, `POST /api/sync` idempotente sull'uuid, coda di invio, stato di sincronizzazione reale al posto di quello simulato. Un solo device registra per partita: la sync è un append, **non scrivere logiche di merge**.

### Fase 9 — rifinitura
Service worker con cache della shell, invito all'installazione sulla schermata Home, accessibilità (focus visibile, etichette dei bottoni della griglia), `prefers-reduced-motion`.

## Come voglio che lavori

- **Chiedi invece di inventare.** Se una decisione non è nelle regole o nel mockup, fermati e chiedi. Vale soprattutto per le questioni aperte elencate in `00-progetto.mdc`.
- **Niente dipendenze non concordate.** Prima di installare un pacchetto che non sia nello stack, chiedi e spiega perché.
- **Niente funzionalità non richieste.** Ogni campo in più è un tap in più a bordo campo. Se pensi che manchi qualcosa, proponilo, non aggiungerlo.
- **Commit piccoli**, uno per unità di lavoro sensata, messaggio in italiano all'imperativo.
- Quando una fase è finita, dimmi in due righe cosa posso provare io a mano per verificarla.
