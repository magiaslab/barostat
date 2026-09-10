# BaroStat 24 — concept e decisioni

Documento di riferimento: cosa è già deciso, perché, e cosa resta aperto.
Il mockup approvato è `mockup.html`, in questa stessa cartella.

## L'idea

Registrare dal vivo **in quale fascia degli 8 secondi dell'azione da 24″ cade ogni canestro**, fatto o subito. Origine: uno schizzo a mano — NOI sopra, LORO sotto, per ogni fascia le colonne `3 2 1 0 = Tot.`

## Modello

Un **evento** è un tiro che ha prodotto punti, più il caso del tiro libero sbagliato:

- **periodo**: Q1–Q4, TS
- **squadra**: noi | loro
- **fascia**: 0–8″ (24→17) · 8–16″ (16→9) · 16–24″ (8→0)
- **esito**: 3 canestro da 3 · 2 canestro da 2 · 1 tiro libero segnato · 0 tiro libero sbagliato

Si registrano **solo eventi da tabellino**. Tiri sbagliati dal campo, palle perse e possessi a vuoto non interessano: erano stati considerati, e scartati, perché avrebbero portato la registrazione da ~70 a ~180 tap a partita.

Conseguenza utile: la somma degli eventi è il punteggio reale, quindi **il tabellone dell'app coincide con quello della palestra** — controllo d'errore gratuito per chi segna.

Metrica di riferimento: **distribuzione percentuale dei punti per fascia**, noi contro loro. Non esistono possessi né punti-per-possesso: il denominatore non viene raccolto, ed è una scelta.

## Decisioni

| Tema | Decisione | Perché |
|---|---|---|
| Assegnazione della fascia | Tap manuale sulla cella | Il tabellone dei 24″ è già appeso in palestra. Un cronometro nell'app andrebbe avviato e resettato a ogni possesso: lavoro in più per chi segna, e una fonte di errori. |
| Cronometro nell'app | Escluso | Vedi sopra. |
| Cosa si registra | 3P, 2P, TL segnato, TL sbagliato | Un tap per evento, ~60–80 a partita. |
| Attribuzione | Solo squadra, nessun roster | Il roster raddoppierebbe i tap e richiederebbe la distinta avversaria aggiornata. |
| Tiri liberi | Nella fascia del fallo, un tap per singolo tiro | 0/2 = due tap su `TL ✕`. Copre 1/2, 1/3 e l'and-one senza casi indefiniti, e regala la percentuale ai liberi. *(da confermare)* |
| Device | Tablet in orizzontale primario, telefono di ripiego | |
| Registrazione simultanea | **Un solo device per partita**, gli altri in sola lettura | Due persone che segnano lo stesso canestro lo conterebbero due volte, e nessun algoritmo può distinguere quel doppione da un canestro vero. |
| Rete | Offline-first, sempre | Vedi sotto. |
| Autenticazione | Google del Workspace SVB, ristretto al dominio | Due o tre utenti, tutti con account del dominio. |

## La realtà del campo

Dal 2025 il referto elettronico è obbligatorio in Italia, quindi ogni palestra ha una linea — ma in trasferta l'accesso dipende dalla squadra di casa. "Linea che esiste ma non ci danno la password" è tecnicamente identico a "nessuna linea".

Perciò l'app **assume sempre l'assenza di rete** e tratta la connessione come un bonus: scrive solo in locale, e sincronizza quando può. Una partita pesa pochi kilobyte, quindi al ritorno della rete — anche un hotspot debole — la sincronizzazione è istantanea.

**L'installazione sulla schermata Home non è cosmesi**: su iOS, Safari cancella lo storage dei siti non installati dopo circa 7 giorni di inattività, e fra una partita e l'altra passa una settimana. Va scritto nelle istruzioni allo staff.

## Le cinque schermate

1. **Accesso** — un solo bottone, Google.
2. **Partite** — elenco con risultato, esito V/S, mini-barra della distribuzione per fascia, stato di sincronizzazione.
3. **Nuova partita** — avversario, data, casa/trasferta, competizione.
4. **Live** — la griglia. Su tablet orizzontale occupa la schermata intera senza scroll, con le due squadre affiancate.
5. **Riepilogo ed export** — frase-sintesi generata dai dati, grafico di confronto, tabelle per quarto, export in testo, CSV e PDF.

## Aperto

- Tiri liberi per singolo tiro o per viaggio in lunetta.
- Rimbalzo offensivo: il clock riparte da 14″, quindi si legge il numero esposto e l'azione riprende in fascia 2. Da confermare.
- Categorie giovanili con durata dell'azione diversa dai 24″.
- Confronto fra partite e andamento stagionale: fuori dal primo rilascio.
