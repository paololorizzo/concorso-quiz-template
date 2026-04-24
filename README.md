# Quiz Template Per Concorsi

Applicazione web pronta da riusare per creare simulatori quiz da una banca dati PDF.

L'idea e semplice: cambi configurazione + PDF, e hai un nuovo simulatore per un altro concorso senza riscrivere tutto da zero.

## Descrizione Breve Per GitHub (About)

Template Next.js per creare simulatori quiz da banca dati PDF, con modalita allenamento, simulazione esame e storico risultati.

## Cosa Fa Il Progetto

- Modalita Allenamento: rispondi a una domanda alla volta e vedi subito se e corretta.
- Modalita Simulazione: estrae un numero casuale di domande e mostra il risultato solo alla fine.
- Storico Locale: salva avanzamento e punteggi nel browser (localStorage).
- Esperienza Mobile-First: layout e interazioni ottimizzate per smartphone.
- Parsing PDF Lato Server: legge la banca dati dal file PDF e genera le domande.

## Flusso Utente

1. Apri la home e scegli Allenamento o Simulazione.
2. Rispondi alle domande.
3. In Allenamento ricevi feedback immediato.
4. In Simulazione ottieni il risultato finale e il riepilogo.
5. Lo storico resta salvato sul dispositivo finche non lo resetti.

## Stack Tecnologico

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- ESLint 9
- pdf-parse

## Avvio Rapido

1. Installa dipendenze: npm install
2. Avvia in sviluppo: npm run dev

Comandi utili:

- npm run lint
- npm run build

## PDF Della Banca Dati

Posiziona il file qui:

- data/source/banca-dati.pdf

Nota: la cartella data e fuori da public, quindi il PDF non e esposto direttamente sul web.

## Personalizzazione Principale

File centrale:

- src/config/contest.ts

Da qui puoi personalizzare:

- titolo del concorso
- descrizione metadata
- numero domande della simulazione
- soglia di superamento
- testi mostrati in home
- link social
- eventuale link Ko-fi per portfolio GitHub

## Come Riusarlo Per Un Nuovo Concorso

1. Duplica il repository.
2. Aggiorna i valori in src/config/contest.ts.
3. Sostituisci il PDF in data/source/banca-dati.pdf.
4. Se il formato del PDF cambia, adatta il parser in src/lib/quiz-parser.ts.

## Struttura Del Progetto

- src/config/contest.ts: configurazione concorso
- src/lib/quiz-parser.ts: parsing PDF
- src/components/quiz-client.tsx: modalita allenamento
- src/components/exam-mode.tsx: modalita simulazione
- src/components/quiz-app.tsx: landing e orchestrazione

## Ko-fi Su GitHub (Non In App)

Il pulsante Ko-fi e stato rimosso dalla UI del simulatore per mantenere l'app pulita.

Se vuoi inserirlo nel README GitHub, usa questo snippet:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V11YDFWH)

## Licenza

Progetto rilasciato con licenza MIT.
Vedi il file LICENSE.