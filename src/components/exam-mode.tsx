"use client";

import { useMemo, useState } from "react";
import type { QuizQuestion } from "@/lib/quiz-parser";
import { DISPLAY_LABELS, randomShuffle } from "@/lib/shuffle";
import { recordExam, setQuestionOutcome } from "@/lib/stats";
import { contestConfig } from "@/config/contest";

const EXAM_SIZE = contestConfig.examQuestionCount;

type ShuffledOption = {
  displayLabel: string;
  text: string;
  isCorrect: boolean;
};

type PreparedQuestion = {
  original: QuizQuestion;
  options: ShuffledOption[];
  correctDisplayLabel: string;
};

function prepareExamQuestions(questions: QuizQuestion[]): PreparedQuestion[] {
  const selected = randomShuffle(questions).slice(0, Math.min(EXAM_SIZE, questions.length));

  return selected.map((q) => {
    const shuffled = randomShuffle(q.options);
    const correctIndex = shuffled.findIndex((o) => o.label === q.correctOriginalLabel);

    const options: ShuffledOption[] = shuffled.map((opt, i) => ({
      displayLabel: DISPLAY_LABELS[i] ?? opt.label,
      text: opt.text,
      isCorrect: opt.label === q.correctOriginalLabel,
    }));

    return {
      original: q,
      options,
      correctDisplayLabel: DISPLAY_LABELS[correctIndex] ?? "A",
    };
  });
}

type ExamModeProps = {
  questions: QuizQuestion[];
  onBack: () => void;
  onComplete: () => void;
  modeLabel?: string;
};

export function ExamMode({
  questions,
  onBack,
  onComplete,
  modeLabel = "Simulazione esame",
}: ExamModeProps) {
  const examQuestions = useMemo(() => prepareExamQuestions(questions), [questions]);
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    Array(examQuestions.length).fill(null),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    correct: number;
    wrong: number;
    omitted: number;
    score: number;
    percent: number;
  } | null>(null);

  const current = examQuestions[currentIndex];

  function selectAnswer(label: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = label;
      return next;
    });
  }

  function submit() {
    const correct = examQuestions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctDisplayLabel ? 1 : 0),
      0,
    );
    const omitted = answers.filter((a) => a === null).length;
    const wrong = Math.max(0, examQuestions.length - correct - omitted);
    const score = correct - wrong * 0.33 - omitted * 0.15;
    const percent = Math.round((score / examQuestions.length) * 100);

    examQuestions.forEach((q, i) => {
      const answer = answers[i];
      if (answer === null) return;
      setQuestionOutcome(q.original.id, answer === q.correctDisplayLabel);
    });

    recordExam(score, examQuestions.length, { correct, wrong, omitted });
    setResult({ correct, wrong, omitted, score, percent });
    onComplete();
    setSubmitted(true);
  }

  if (!current) return null;

  // ─── Schermata risultati ───────────────────────────────────────────────────
  if (submitted) {
    const finalResult =
      result ??
      (() => {
        const correct = examQuestions.reduce(
          (acc, q, i) => acc + (answers[i] === q.correctDisplayLabel ? 1 : 0),
          0,
        );
        const omitted = answers.filter((a) => a === null).length;
        const wrong = Math.max(0, examQuestions.length - correct - omitted);
        const score = correct - wrong * 0.33 - omitted * 0.15;
        const percent = Math.round((score / examQuestions.length) * 100);
        return { correct, wrong, omitted, score, percent };
      })();

    const passed = finalResult.percent >= contestConfig.passingScorePercent;

    return (
      <main className="min-h-screen min-h-dvh bg-[linear-gradient(180deg,_#fff8e8_0%,_#fffdf7_30%,_#f8fafc_100%)] px-4 py-8 pb-[env(safe-area-inset-bottom,16px)] text-slate-900">
        <div className="mx-auto grid w-full max-w-2xl gap-6">
          <div
            className={`rounded-[1.5rem] border p-7 text-center ${
              passed ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"
            }`}
          >
            <p
              className={`text-sm font-medium uppercase tracking-[0.35em] ${
                passed ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {passed ? "Superato" : "Non superato"}
            </p>
            <p
              className={`mt-3 text-6xl font-bold ${
                passed ? "text-emerald-900" : "text-rose-900"
              }`}
            >
              {finalResult.percent}%
            </p>
            <p className={`mt-1 text-base ${passed ? "text-emerald-800" : "text-rose-800"}`}>
              Punteggio finale: {finalResult.score.toFixed(2)} su {examQuestions.length}
            </p>
            <p className={`mt-1 text-sm ${passed ? "text-emerald-700" : "text-rose-700"}`}>
              {finalResult.correct} corrette · {finalResult.wrong} errate · {finalResult.omitted} omesse
            </p>
            <p className={`mt-1 text-xs ${passed ? "text-emerald-700" : "text-rose-700"}`}>
              Formula: +1 corretta · -0.33 errata · -0.15 omessa
            </p>
          </div>

          <div className="grid gap-3">
            <h2 className="text-base font-semibold text-slate-950">Riepilogo domande</h2>
            {examQuestions.map((q, i) => {
              const userAnswer = answers[i];
              const correct = userAnswer === q.correctDisplayLabel;
              return (
                <div
                  key={q.original.id}
                  className={`rounded-[1.25rem] border px-4 py-3.5 text-sm ${
                    correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 font-bold ${
                        correct ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {correct ? "✓" : "✗"}
                    </span>
                    <div className="grid gap-1">
                      <p className="text-[0.85rem] leading-5 text-slate-800">{q.original.prompt}</p>
                      {!correct && (
                        <p className="text-xs text-rose-700">
                          Hai risposto: <strong>{userAnswer ?? "—"}</strong> · Corretta:{" "}
                          <strong>{q.correctDisplayLabel}</strong> —{" "}
                          {q.options.find((o) => o.displayLabel === q.correctDisplayLabel)?.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onBack}
            className="min-h-[52px] justify-self-start rounded-full border border-slate-300 px-6 text-sm font-medium text-slate-700 active:bg-slate-50 transition"
          >
            ← Torna alla home
          </button>
        </div>
      </main>
    );
  }

  // ─── Schermata domanda ─────────────────────────────────────────────────────
  const selectedLabel = answers[currentIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLast = currentIndex === examQuestions.length - 1;

  return (
    <main className="min-h-screen min-h-dvh bg-[linear-gradient(180deg,_#fff8e8_0%,_#fffdf7_30%,_#f8fafc_100%)] text-slate-900">
      {/* Header sticky */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] text-sm text-slate-500 active:text-slate-900 transition"
        >
          ← Esci
        </button>
        <span className="text-xs text-slate-500">{answeredCount}/{examQuestions.length} date</span>
        <span className="text-sm font-semibold text-slate-900">
          {currentIndex + 1} / {examQuestions.length}
        </span>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{modeLabel}</p>
      </div>

      <div className="mx-auto grid w-full max-w-2xl gap-4 px-4 py-4 pb-[calc(80px+env(safe-area-inset-bottom,16px))]">
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-slate-200">
          <div
            className="h-1 rounded-full bg-amber-500 transition-all"
            style={{ width: `${((currentIndex + 1) / examQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <article className="grid gap-4 rounded-[1.5rem] border border-amber-200/70 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.2)]">
          <h2 className="text-[1.1rem] font-semibold leading-snug text-slate-950">
            {current.original.prompt}
          </h2>

          <div className="grid gap-2.5">
            {current.options.map((option) => {
              const isSelected = selectedLabel === option.displayLabel;
              return (
                <button
                  key={option.displayLabel}
                  type="button"
                  onClick={() => selectAnswer(option.displayLabel)}
                  className={[
                    "min-h-[52px] rounded-[1.1rem] border px-4 py-3 text-left active:scale-[0.99] transition",
                    isSelected
                      ? "border-amber-500 bg-amber-50 text-slate-950"
                      : "border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{option.displayLabel}</span>
                  <span className="ml-2 text-sm leading-6">{option.text}</span>
                </button>
              );
            })}
          </div>
        </article>

        {/* Griglia navigazione rapida — scroll orizzontale su mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {examQuestions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={[
                "h-8 w-8 shrink-0 rounded-full text-xs font-medium transition active:scale-95",
                i === currentIndex
                  ? "bg-amber-500 text-white"
                  : answers[i] !== null
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-500",
              ].join(" ")}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Barra azioni fissa in basso */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] backdrop-blur">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="min-h-[52px] flex-1 rounded-full border border-slate-300 text-sm font-medium text-slate-700 disabled:border-slate-200 disabled:text-slate-300 active:bg-slate-50 transition"
        >
          ← Prec
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={submit}
            className="min-h-[52px] flex-[2] rounded-full bg-slate-950 text-sm font-medium text-white active:bg-slate-800 transition"
          >
            Consegna esame
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="min-h-[52px] flex-[2] rounded-full bg-slate-950 text-sm font-medium text-white active:bg-slate-800 transition"
          >
            Successiva →
          </button>
        )}
      </div>
    </main>
  );
}
