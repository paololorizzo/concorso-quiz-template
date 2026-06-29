export type ExamRecord = {
  id: string;
  date: number;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  omitted: number;
};

export type Stats = {
  practiceAnswered: number;
  practiceCorrect: number;
  practiceLastAnsweredIndex: number;
  wrongQuestionIds: string[];
  exams: ExamRecord[];
};

const SELECTED_TEST_KEY = "domanderichi-selected-test";
const LEGACY_KEY = "domanderichi-v1";

function statsKey(testId: string) {
  return `domanderichi-v1-${testId}`;
}

export function emptyStats(): Stats {
  return {
    practiceAnswered: 0,
    practiceCorrect: 0,
    practiceLastAnsweredIndex: -1,
    wrongQuestionIds: [],
    exams: [],
  };
}

function normalizeStats(raw: unknown): Stats {
  if (!raw || typeof raw !== "object") return emptyStats();

  const input = raw as Partial<Stats>;
  const practiceAnswered = Number.isFinite(input.practiceAnswered)
    ? Math.max(0, Math.trunc(input.practiceAnswered as number))
    : 0;
  const practiceCorrect = Number.isFinite(input.practiceCorrect)
    ? Math.max(0, Math.trunc(input.practiceCorrect as number))
    : 0;
  const practiceLastAnsweredIndex = Number.isFinite(input.practiceLastAnsweredIndex)
    ? Math.max(-1, Math.trunc(input.practiceLastAnsweredIndex as number))
    : -1;
  const wrongQuestionIds = Array.isArray((input as { wrongQuestionIds?: unknown }).wrongQuestionIds)
    ? Array.from(
        new Set(
          ((input as { wrongQuestionIds?: unknown[] }).wrongQuestionIds ?? []).filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      )
    : [];
  const exams = Array.isArray(input.exams)
    ? (input.exams as Partial<ExamRecord>[])
        .map((exam) => {
          const total = Number.isFinite(exam.total) ? Math.max(0, Number(exam.total)) : 0;
          const score = Number.isFinite(exam.score) ? Number(exam.score) : 0;
          const correct = Number.isFinite(exam.correct) ? Math.max(0, Number(exam.correct)) : 0;
          const wrong = Number.isFinite(exam.wrong) ? Math.max(0, Number(exam.wrong)) : 0;
          const omitted = Number.isFinite(exam.omitted)
            ? Math.max(0, Number(exam.omitted))
            : Math.max(0, total - correct - wrong);
          return {
            id: typeof exam.id === "string" && exam.id.length > 0 ? exam.id : Date.now().toString(36),
            date: Number.isFinite(exam.date) ? Number(exam.date) : Date.now(),
            score,
            total,
            correct,
            wrong,
            omitted,
          };
        })
        .slice(0, 50)
    : [];

  return {
    practiceAnswered,
    practiceCorrect,
    practiceLastAnsweredIndex,
    wrongQuestionIds,
    exams,
  };
}

/** Migra i dati dalla chiave legacy (singolo test) alla nuova chiave per testId. */
export function migrateV1Stats(testId: string): void {
  if (typeof window === "undefined") return;
  const newKey = statsKey(testId);
  if (localStorage.getItem(newKey)) return;
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  localStorage.setItem(newKey, legacy);
  localStorage.removeItem(LEGACY_KEY);
}

export function loadStats(testId: string): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(statsKey(testId));
    return raw ? normalizeStats(JSON.parse(raw)) : emptyStats();
  } catch {
    return emptyStats();
  }
}

export function saveStats(testId: string, s: Stats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(statsKey(testId), JSON.stringify(s));
}

export function resetStats(testId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(statsKey(testId));
}

export function recordPracticeAnswer(testId: string, correct: boolean): void {
  const s = loadStats(testId);
  s.practiceAnswered += 1;
  if (correct) s.practiceCorrect += 1;
  saveStats(testId, s);
}

export function setQuestionOutcome(testId: string, questionId: string, correct: boolean): void {
  if (!questionId) return;
  const s = loadStats(testId);
  const current = new Set(s.wrongQuestionIds);
  if (correct) {
    current.delete(questionId);
  } else {
    current.add(questionId);
  }
  s.wrongQuestionIds = Array.from(current);
  saveStats(testId, s);
}

export function setPracticeLastAnsweredIndex(testId: string, index: number): void {
  const s = loadStats(testId);
  s.practiceLastAnsweredIndex = Math.max(-1, Math.trunc(index));
  saveStats(testId, s);
}

export function recordExam(
  testId: string,
  score: number,
  total: number,
  details?: { correct: number; wrong: number; omitted: number },
): ExamRecord {
  const s = loadStats(testId);
  const safeTotal = Math.max(0, Math.trunc(total));
  const safeCorrect = Math.max(0, Math.trunc(details?.correct ?? 0));
  const safeWrong = Math.max(0, Math.trunc(details?.wrong ?? Math.max(0, safeTotal - safeCorrect)));
  const safeOmitted = Math.max(
    0,
    Math.trunc(details?.omitted ?? Math.max(0, safeTotal - safeCorrect - safeWrong)),
  );
  const record: ExamRecord = {
    id: Date.now().toString(36),
    date: Date.now(),
    score,
    total: safeTotal,
    correct: safeCorrect,
    wrong: safeWrong,
    omitted: safeOmitted,
  };
  s.exams = [record, ...s.exams].slice(0, 50);
  saveStats(testId, s);
  return record;
}

// ─── Persistenza del test selezionato ─────────────────────────────────────────

export function loadSelectedTestId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SELECTED_TEST_KEY);
  } catch {
    return null;
  }
}

export function saveSelectedTestId(testId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELECTED_TEST_KEY, testId);
}

export function clearSelectedTestId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SELECTED_TEST_KEY);
}
