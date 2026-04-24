"use client";

import { useMemo, useState } from "react";
import type { QuizQuestion } from "@/lib/quiz-parser";
import { DISPLAY_LABELS, seededShuffle, seedFromString } from "@/lib/shuffle";
import { recordPracticeAnswer, setPracticeLastAnsweredIndex } from "@/lib/stats";

type QuizClientProps = {
  questions: QuizQuestion[];
  onBack: () => void;
  onAnswer?: () => void;
  startIndex?: number;
};

export function QuizClient({ questions, onBack, onAnswer, startIndex = 0 }: QuizClientProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!questions.length) return 0;
    return Math.min(Math.max(0, startIndex), questions.length - 1);
  });
  const [selectedDisplayLabel, setSelectedDisplayLabel] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[currentIndex];

  /**
   * Ogni volta che cambia domanda, rimescola le opzioni con un seed
   * derivato dall'indice + id, così ogni domanda ha un ordine stabile
   * ma diverso. Calcola anche quale etichetta display è corretta.
   */
  const { shuffledOptions, correctDisplayLabel } = useMemo(() => {
    if (!question) return { shuffledOptions: [], correctDisplayLabel: null };

    const seed = seedFromString(`${question.id}|${question.prompt}`);
    const shuffled = seededShuffle(question.options, seed);

    const correctIndex = shuffled.findIndex(
      (opt) => opt.label === question.correctOriginalLabel,
    );
    const correctLabel = correctIndex >= 0 ? (DISPLAY_LABELS[correctIndex] ?? null) : null;

    const withDisplayLabels = shuffled.map((opt, i) => ({
      ...opt,
      displayLabel: DISPLAY_LABELS[i] ?? opt.label,
    }));

    return { shuffledOptions: withDisplayLabels, correctDisplayLabel: correctLabel };
  }, [currentIndex, question]);

  if (!question) {
    return null;
  }

  const isLastQuestion = currentIndex === questions.length - 1;
  const canEvaluate = selectedDisplayLabel !== null;

  function revealAnswer() {
    if (!canEvaluate || revealed) return;
    const correct = selectedDisplayLabel === correctDisplayLabel;
    if (correct) setCorrectCount((value) => value + 1);
    recordPracticeAnswer(correct);
    setPracticeLastAnsweredIndex(currentIndex);
    onAnswer?.();
    setRevealed(true);
  }

  function goToNextQuestion() {
    if (isLastQuestion) {
      onBack();
      return;
    }
    setCurrentIndex((value) => value + 1);
    setSelectedDisplayLabel(null);
    setRevealed(false);
  }

  return (
    <main className="min-h-screen min-h-dvh bg-[linear-gradient(180deg,_#fff8e8_0%,_#fffdf7_30%,_#f8fafc_100%)] text-slate-900">
    {/* Header sticky */}
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
      <button
        onClick={onBack}
        className="min-h-[44px] min-w-[44px] text-sm text-slate-500 active:text-slate-900 transition"
      >
        ← Home
      </button>
      <span className="text-sm text-slate-600">
        {currentIndex + 1} / {questions.length}
      </span>
      <span className="text-sm font-semibold text-slate-900">{correctCount} ✓</span>
    </header>

    <div className="mx-auto grid w-full max-w-2xl gap-4 px-4 py-5 pb-[calc(80px+env(safe-area-inset-bottom,16px))]">
      <article className="grid gap-4 rounded-[1.5rem] border border-amber-200/70 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.2)]">
        <h2 className="text-[1.1rem] font-semibold leading-snug text-slate-950">
          {question.prompt}
        </h2>

        <div className="grid gap-2.5">
          {shuffledOptions.map((option) => {
            const isSelected = selectedDisplayLabel === option.displayLabel;
            const isCorrect = revealed && correctDisplayLabel === option.displayLabel;
            const isWrong = revealed && isSelected && correctDisplayLabel !== option.displayLabel;

            return (
              <button
                key={option.displayLabel}
                type="button"
                onClick={() => !revealed && setSelectedDisplayLabel(option.displayLabel)}
                className={[
                  "min-h-[52px] rounded-[1.1rem] border px-4 py-3 text-left active:scale-[0.99] transition",
                  isCorrect
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                    : isWrong
                      ? "border-rose-500 bg-rose-50 text-rose-950"
                      : isSelected
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

        {revealed && correctDisplayLabel ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
            Risposta corretta: <strong>{correctDisplayLabel}</strong>
          </p>
        ) : null}
      </article>
    </div>

    {/* Barra azioni fissa in basso */}
    <div className="fixed bottom-0 left-0 right-0 z-10 flex gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] backdrop-blur">
      <button
        type="button"
        onClick={revealAnswer}
        disabled={!canEvaluate || revealed}
        className="min-h-[52px] flex-1 rounded-full bg-slate-950 text-sm font-medium text-white disabled:bg-slate-200 disabled:text-slate-400 active:bg-slate-800 transition"
      >
        Verifica
      </button>
      <button
        type="button"
        onClick={goToNextQuestion}
        disabled={!revealed}
        className="min-h-[52px] flex-1 rounded-full border border-slate-300 text-sm font-medium text-slate-700 disabled:border-slate-200 disabled:text-slate-300 active:bg-slate-50 transition"
      >
        {isLastQuestion ? "Fine sessione" : "Avanti →"}
      </button>
    </div>
    </main>
  );
}