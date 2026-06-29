import { readFile } from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";
import type { TestConfig } from "@/config/contest";

export type QuizOption = {
  /** Etichetta originale del PDF (A/B/C). */
  label: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  /** Opzioni nell'ordine originale del PDF. */
  options: QuizOption[];
  /**
   * Etichetta originale della risposta corretta nel PDF.
   * In questo PDF è sempre "A".
   * Il componente client rimescola le opzioni e ricalcola
   * quale etichetta display corrisponde.
   */
  correctOriginalLabel: string;
};

export type QuizSourceResult = {
  sourcePath: string;
  exists: boolean;
  questions: QuizQuestion[];
  warnings: string[];
};

// Il PDF dichiara esplicitamente: "la risposta esatta è sempre la A"
const CORRECT_LABEL = "A";

const cache = new Map<string, Promise<QuizSourceResult>>();

function normalizeText(input: string) {
  return input
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ /g, " ")
    .trim();
}

/**
 * Divide il testo in blocchi: ogni blocco inizia con "N) " o "N) \n".
 * Gestisce anche la numerazione a due cifre seguita da spazi (es. "10) ").
 */
function splitQuestionBlocks(text: string): string[] {
  const boundary = /(?:^|\n)(?=\d{1,4}\) )/g;
  const parts = text.split(boundary).map((s) => s.trim()).filter(Boolean);
  return parts.filter((part) => /^\d{1,4}\) /.test(part));
}

function parseBlock(block: string): QuizQuestion | null {
  const questionMatch = block.match(/^(\d{1,4})\) \n?(.+?)\n(?=[A-C]\) )/s);
  if (!questionMatch) return null;

  const questionNumber = questionMatch[1];
  const prompt = questionMatch[2].replace(/\n/g, " ").trim();

  const optionRegex = /([A-C])\) \n?(.+?)(?=\n[A-C]\) |\nID:|$)/gs;
  const options: QuizOption[] = [];

  for (const match of block.matchAll(optionRegex)) {
    options.push({
      label: match[1],
      text: match[2].replace(/\n/g, " ").trim(),
    });
  }

  if (options.length < 2 || !prompt) return null;

  return {
    id: `q-${questionNumber}`,
    prompt,
    options,
    correctOriginalLabel: CORRECT_LABEL,
  };
}

function parseQuestions(text: string): QuizQuestion[] {
  const normalized = normalizeText(text);
  const blocks = splitQuestionBlocks(normalized);

  return blocks
    .map((block) => parseBlock(block))
    .filter((q): q is QuizQuestion => q !== null);
}

export async function loadQuizSourceById(testId: string, pdfFilename: string): Promise<QuizSourceResult> {
  if (!cache.has(testId)) {
    cache.set(testId, (async () => {
      const sourcePath = path.join(process.cwd(), "data", "source", pdfFilename);

      try {
        const buffer = await readFile(sourcePath);
        const parsedPdf = await pdf(buffer);
        const questions = parseQuestions(parsedPdf.text);
        const warnings: string[] = [];

        if (questions.length === 0) {
          warnings.push(
            "Nessuna domanda riconosciuta automaticamente. Probabilmente serve adattare il parser al formato esatto del PDF.",
          );
        }

        return {
          sourcePath,
          exists: true,
          questions,
          warnings,
        } satisfies QuizSourceResult;
      } catch {
        return {
          sourcePath,
          exists: false,
          questions: [],
          warnings: [
            "Inserisci il PDF della banca dati nel percorso indicato per attivare il quiz.",
          ],
        } satisfies QuizSourceResult;
      }
    })());
  }

  return cache.get(testId)!;
}

export async function loadAllQuizSources(
  testConfigs: TestConfig[],
): Promise<Record<string, QuizQuestion[]>> {
  const entries = await Promise.all(
    testConfigs.map(async (t) => {
      const result = await loadQuizSourceById(t.id, t.pdfFilename);
      return [t.id, result.questions] as const;
    }),
  );
  return Object.fromEntries(entries);
}
