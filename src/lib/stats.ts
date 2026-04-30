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

const KEY = "domanderichi-v1";

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

export function loadStats(): Stats {
  if (typeof window === "undefined") return emptyStats();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeStats(JSON.parse(raw)) : emptyStats();
  } catch {
    return emptyStats();
  }
}

export function saveStats(s: Stats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function resetStats(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function recordPracticeAnswer(correct: boolean): void {
  const s = loadStats();
  s.practiceAnswered += 1;
  if (correct) s.practiceCorrect += 1;
  saveStats(s);
}

export function setQuestionOutcome(questionId: string, correct: boolean): void {
  if (!questionId) return;
  const s = loadStats();
  const current = new Set(s.wrongQuestionIds);
  if (correct) {
    current.delete(questionId);
  } else {
    current.add(questionId);
  }
  s.wrongQuestionIds = Array.from(current);
  saveStats(s);
}

export function setPracticeLastAnsweredIndex(index: number): void {
  const s = loadStats();
  s.practiceLastAnsweredIndex = Math.max(-1, Math.trunc(index));
  saveStats(s);
}

export function recordExam(
  score: number,
  total: number,
  details?: { correct: number; wrong: number; omitted: number },
): ExamRecord {
  const s = loadStats();
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
  saveStats(s);
  return record;
}
