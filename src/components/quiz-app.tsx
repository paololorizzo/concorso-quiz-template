"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuizQuestion } from "@/lib/quiz-parser";
import { type Stats, emptyStats, loadStats, resetStats, migrateV1Stats, loadSelectedTestId, saveSelectedTestId, clearSelectedTestId } from "@/lib/stats";
import { QuizClient } from "@/components/quiz-client";
import { ExamMode } from "@/components/exam-mode";
import { TestSelector } from "@/components/test-selector";
import { tests } from "@/config/contest";

type Mode = "home" | "practice" | "practice-wrong" | "exam" | "exam-wrong";
type Screen = "select-test" | Mode;

export function QuizApp({ allQuestions }: { allQuestions: Record<string, QuizQuestion[]> }) {
  const [screen, setScreen] = useState<Screen>("select-test");
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>(emptyStats());

  const questionCounts = useMemo(
    () => Object.fromEntries(Object.entries(allQuestions).map(([id, qs]) => [id, qs.length])),
    [allQuestions],
  );

  useEffect(() => {
    const saved = loadSelectedTestId();
    if (saved && allQuestions[saved]) {
      migrateV1Stats(saved);
      setActiveTestId(saved);
      setStats(loadStats(saved));
      setScreen("home");
    }
  }, [allQuestions]);

  const activeConfig = useMemo(
    () => tests.find((t) => t.id === activeTestId) ?? null,
    [activeTestId],
  );

  const questions = activeTestId ? (allQuestions[activeTestId] ?? []) : [];
  const wrongQuestionSet = new Set(stats.wrongQuestionIds);
  const wrongQuestions = questions.filter((q) => wrongQuestionSet.has(q.id));

  const practiceStartIndex =
    questions.length > 0
      ? Math.min(stats.practiceLastAnsweredIndex + 1, questions.length - 1)
      : 0;

  const refreshStats = useCallback(() => {
    if (!activeTestId) return;
    setStats(loadStats(activeTestId));
  }, [activeTestId]);

  function selectTest(testId: string) {
    migrateV1Stats(testId);
    saveSelectedTestId(testId);
    setActiveTestId(testId);
    setStats(loadStats(testId));
    setScreen("home");
  }

  function backToSelector() {
    clearSelectedTestId();
    setActiveTestId(null);
    setStats(emptyStats());
    setScreen("select-test");
  }

  const handleResetHistory = useCallback(() => {
    if (!activeTestId) return;
    const confirmed = window.confirm(
      "Vuoi davvero cancellare tutto lo storico? Questa azione non puo essere annullata.",
    );
    if (!confirmed) return;
    resetStats(activeTestId);
    setStats(emptyStats());
  }, [activeTestId]);

  // ─── Selezione test ────────────────────────────────────────────────────────
  if (screen === "select-test") {
    return (
      <TestSelector
        tests={tests}
        questionCounts={questionCounts}
        onSelect={selectTest}
      />
    );
  }

  if (!activeConfig || !activeTestId) return null;

  // ─── Modalità allenamento ──────────────────────────────────────────────────
  if (screen === "practice") {
    return (
      <QuizClient
        testId={activeTestId}
        questions={questions}
        startIndex={practiceStartIndex}
        shuffleQuestions={false}
        modeLabel="Allenamento libero"
        onBack={() => {
          refreshStats();
          setScreen("home");
        }}
        onAnswer={refreshStats}
      />
    );
  }

  if (screen === "practice-wrong") {
    return (
      <QuizClient
        testId={activeTestId}
        questions={wrongQuestions}
        startIndex={0}
        trackProgress={false}
        modeLabel="Ripeti domande sbagliate"
        onBack={() => {
          refreshStats();
          setScreen("home");
        }}
      />
    );
  }

  if (screen === "exam") {
    return (
      <ExamMode
        testId={activeTestId}
        questions={questions}
        examQuestionCount={activeConfig.examQuestionCount}
        passingScorePercent={activeConfig.passingScorePercent}
        modeLabel="Simulazione esame"
        onBack={() => {
          refreshStats();
          setScreen("home");
        }}
        onComplete={refreshStats}
      />
    );
  }

  if (screen === "exam-wrong") {
    return (
      <ExamMode
        testId={activeTestId}
        questions={wrongQuestions}
        examQuestionCount={activeConfig.examQuestionCount}
        passingScorePercent={activeConfig.passingScorePercent}
        modeLabel="Simulazione su domande sbagliate"
        onBack={() => {
          refreshStats();
          setScreen("home");
        }}
        onComplete={refreshStats}
      />
    );
  }

  // ─── Home ──────────────────────────────────────────────────────────────────
  const accuracy =
    stats.practiceAnswered > 0
      ? Math.round((stats.practiceCorrect / stats.practiceAnswered) * 100)
      : null;

  const bestExam =
    stats.exams.length > 0
      ? Math.max(...stats.exams.map((e) => e.score))
      : null;

  return (
    <main className="min-h-screen min-h-dvh bg-[linear-gradient(180deg,_#fff8e8_0%,_#fffdf7_30%,_#f8fafc_100%)] px-4 py-8 pb-[env(safe-area-inset-bottom,16px)] text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-4xl gap-8">
        {/* Intestazione */}
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-amber-700">
            {activeConfig.eyebrow}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {activeConfig.title}
          </h1>
          <p className="text-slate-500">{questions.length} domande disponibili</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={activeConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 active:bg-slate-50 transition"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current">
                <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm8.5 1.8h-8.5A3.96 3.96 0 0 0 3.8 7.75v8.5a3.96 3.96 0 0 0 3.95 3.95h8.5a3.96 3.96 0 0 0 3.95-3.95v-8.5a3.96 3.96 0 0 0-3.95-3.95ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Zm5.4-3.15a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
              </svg>
              <span>{activeConfig.instagramLabel}</span>
            </a>
            {tests.length > 1 && (
              <button
                type="button"
                onClick={backToSelector}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 active:bg-slate-50 transition"
              >
                ← Cambia concorso
              </button>
            )}
          </div>
        </div>

        {/* Modalità */}
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setScreen("practice")}
            className="min-h-[120px] rounded-[1.5rem] border border-amber-200 bg-white p-5 text-left shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] active:scale-[0.98] transition-transform sm:p-7"
          >
            <div className="mb-3 text-2xl">📚</div>
            <h2 className="text-lg font-semibold text-slate-950">Allenamento libero</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {activeConfig.practiceModeDescription}
            </p>
          </button>

          <button
            onClick={() => setScreen("exam")}
            className="min-h-[120px] rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] active:scale-[0.98] transition-transform sm:p-7"
          >
            <div className="mb-3 text-2xl">🎯</div>
            <h2 className="text-lg font-semibold text-slate-950">Simulazione esame</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {activeConfig.examModeDescription}
            </p>
          </button>

          <button
            onClick={() => setScreen("practice-wrong")}
            disabled={wrongQuestions.length === 0}
            className="min-h-[120px] rounded-[1.5rem] border border-orange-200 bg-white p-5 text-left shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed sm:p-7"
          >
            <div className="mb-3 text-2xl">🔁</div>
            <h2 className="text-lg font-semibold text-slate-950">Ripeti domande sbagliate</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Allenamento mirato su {wrongQuestions.length} domande ancora da recuperare.
            </p>
          </button>

          <button
            onClick={() => setScreen("exam-wrong")}
            disabled={wrongQuestions.length === 0}
            className="min-h-[120px] rounded-[1.5rem] border border-orange-200 bg-white p-5 text-left shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed sm:p-7"
          >
            <div className="mb-3 text-2xl">🧠</div>
            <h2 className="text-lg font-semibold text-slate-950">Simulazione su errori</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Estrazione casuale dalle domande sbagliate in precedenza.
            </p>
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Il tuo storico</h2>
            <button
              type="button"
              onClick={handleResetHistory}
              className="min-h-[40px] rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-rose-700 active:bg-rose-100 transition"
            >
              Reset storico
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Risposte allenamento", value: stats.practiceAnswered.toString() },
              { label: "Precisione", value: accuracy !== null ? `${accuracy}%` : "—" },
              { label: "Domande da ripetere", value: wrongQuestions.length.toString() },
              { label: "Simulazioni", value: stats.exams.length.toString() },
              {
                label: "Miglior punteggio",
                value: bestExam !== null ? bestExam.toFixed(2) : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                <p className="text-xl font-semibold text-slate-950">{value}</p>
                <p className="mt-0.5 text-xs leading-4 text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Storico simulazioni */}
          {stats.exams.length > 0 && (
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-medium text-slate-700">
                  Ultime {Math.min(stats.exams.length, 10)} simulazioni
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.exams.slice(0, 10).map((exam) => {
                  const passingScore = (activeConfig.passingScorePercent / 100) * exam.total;
                  const passed = exam.score >= passingScore;
                  return (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span className="text-slate-500">
                        {new Date(exam.date).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${passed ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        {exam.score.toFixed(2)}/{exam.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
