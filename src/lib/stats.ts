export type ExamRecord = {
  id: string;
  date: number;
  score: number;
  total: number;
};

export type Stats = {
  practiceAnswered: number;
  practiceCorrect: number;
  practiceLastAnsweredIndex: number;
  exams: ExamRecord[];
};

const KEY = "domanderichi-v1";

export function emptyStats(): Stats {
  return { practiceAnswered: 0, practiceCorrect: 0, practiceLastAnsweredIndex: -1, exams: [] };
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

  return {
    practiceAnswered,
    practiceCorrect,
    practiceLastAnsweredIndex,
    exams: Array.isArray(input.exams) ? (input.exams as ExamRecord[]) : [],
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

export function setPracticeLastAnsweredIndex(index: number): void {
  const s = loadStats();
  s.practiceLastAnsweredIndex = Math.max(-1, Math.trunc(index));
  saveStats(s);
}

export function recordExam(score: number, total: number): ExamRecord {
  const s = loadStats();
  const record: ExamRecord = {
    id: Date.now().toString(36),
    date: Date.now(),
    score,
    total,
  };
  s.exams = [record, ...s.exams].slice(0, 50);
  saveStats(s);
  return record;
}
