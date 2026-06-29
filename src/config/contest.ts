export type TestConfig = {
  id: string;
  pdfFilename: string;
  emoji: string;
  title: string;
  eyebrow: string;
  description: string;
  metadataDescription: string;
  practiceModeDescription: string;
  examModeDescription: string;
  examQuestionCount: number;
  passingScorePercent: number;
  instagramUrl: string;
  instagramLabel: string;
  koFiUrl: string;
};

export const tests: TestConfig[] = [
  {
    id: "oss-bari",
    pdfFilename: "banca-dati.pdf",
    emoji: "🏥",
    title: "Concorso Pubblico OSS Bari 2026",
    eyebrow: "Banca dati concorso",
    description: "Operatore Socio Sanitario – ASL Bari",
    metadataDescription: "Quiz interattivo da banca dati PDF per concorsi.",
    practiceModeDescription: "Risponde una alla volta, vedi subito la risposta corretta.",
    examModeDescription: "33 domande casuali, risultato solo alla fine.",
    examQuestionCount: 33,
    passingScorePercent: 60,
    instagramUrl: "https://instagram.com/paolo_lorizzo",
    instagramLabel: "Instagram: @paolo_lorizzo",
    koFiUrl: "https://ko-fi.com/V7V11YDFWH",
  },
  {
    id: "infermieri",
    pdfFilename: "banca-dati-infermieri-27-06.pdf",
    emoji: "💉",
    title: "Concorso Pubblico Infermieri",
    eyebrow: "Banca dati concorso",
    description: "Infermiere – prova scritta",
    metadataDescription: "Quiz interattivo da banca dati PDF per il concorso infermieri.",
    practiceModeDescription: "Risponde una alla volta, vedi subito la risposta corretta.",
    examModeDescription: "Domande casuali, risultato solo alla fine.",
    examQuestionCount: 33,
    passingScorePercent: 60,
    instagramUrl: "https://instagram.com/paolo_lorizzo",
    instagramLabel: "Instagram: @paolo_lorizzo",
    koFiUrl: "https://ko-fi.com/V7V11YDFWH",
  },
];

export const siteConfig = {
  title: "Quiz Concorsi",
  metadataDescription: "Quiz interattivi da banca dati PDF per concorsi pubblici.",
  instagramUrl: "https://instagram.com/paolo_lorizzo",
  instagramLabel: "Instagram: @paolo_lorizzo",
};
