# BaroStat 24

PWA per registrare dal vivo, durante le partite di basket, **dove cade il canestro dentro i 24 secondi dell'azione**.

Ogni canestro — fatto o subito — viene assegnato a una delle tre fasce da otto secondi in cui si divide l'azione, e l'app restituisce la distribuzione dei punti per fascia, per quarto e per partita. È la risposta a una domanda che il tabellino normale non pone: *quando* segniamo, dentro l'azione?

SVB Basket San Vincenzo.

## Come si legge il dato

| Fascia | Cronometro dei 24″ | Cosa racconta |
|---|---|---|
| 0–8″ | 24 → 17 | transizione ed early offense |
| 8–16″ | 16 → 9 | gioco costruito a metà campo |
| 16–24″ | 8 → 0 | clock basso, tiro forzato |

Si registrano **solo eventi da tabellino**: canestro da 3, canestro da 2, tiro libero segnato, tiro libero sbagliato. Tiri sbagliati dal campo, palle perse e possessi a vuoto non interessano.

Conseguenza utile: la somma degli eventi è il punteggio reale, quindi **il tabellone dell'app deve coincidere con quello della palestra**. Se divergono, chi segna ha saltato un tap.

## Stack

- **Next.js** (App Router) su **Vercel**
- **shadcn/ui** + Tailwind
- **Neon** (Postgres) + **Drizzle ORM**
- **Auth.js v5** con Google, ristretto al dominio Workspace
- **Dexie** (IndexedDB) come fonte di verità durante la partita

## Avvio

```bash
cp .env.example .env.local   # e compila i valori
npm install
npm run dev
```

## Typecheck

`tsc --noEmit` da solo fallisce se mancano i tipi generati da Next (es. `LayoutProps`). Generali prima, oppure usa lo script unico:

```bash
npm run typegen      # next typegen
npm run typecheck    # next typegen && tsc --noEmit
```

## Dove guardare prima di scrivere codice

| File | Cosa contiene |
|---|---|
| `docs/PROMPT-CURSOR.md` | Il brief operativo: cosa costruire e in che ordine |
| `docs/concept.md` | Modello dei dati, decisioni prese e questioni aperte |
| `docs/mockup.html` | Il mockup approvato, apribile nel browser |
| `docs/design-tokens.css` | Token di colore e tipografia, pronti da incollare |
| `.cursor/rules/` | Regole permanenti per l'agente |
