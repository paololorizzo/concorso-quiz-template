"use client";

import type { TestConfig } from "@/config/contest";
import { siteConfig } from "@/config/contest";

type TestSelectorProps = {
  tests: TestConfig[];
  questionCounts: Record<string, number>;
  onSelect: (testId: string) => void;
};

export function TestSelector({ tests, questionCounts, onSelect }: TestSelectorProps) {
  return (
    <main className="min-h-screen min-h-dvh bg-[linear-gradient(180deg,_#fff8e8_0%,_#fffdf7_30%,_#f8fafc_100%)] px-4 py-8 pb-[env(safe-area-inset-bottom,16px)] text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-4xl gap-8">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-amber-700">
            Seleziona concorso
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Per cosa ti prepari?
          </h1>
          <p className="text-slate-500">Scegli il concorso — i progressi sono salvati separatamente.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tests.map((test) => {
            const count = questionCounts[test.id] ?? 0;
            return (
              <button
                key={test.id}
                onClick={() => onSelect(test.id)}
                className="min-h-[140px] rounded-[1.5rem] border border-amber-200 bg-white p-5 text-left shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] active:scale-[0.98] transition-transform sm:p-7"
              >
                <div className="mb-3 text-3xl">{test.emoji}</div>
                <h2 className="text-lg font-semibold text-slate-950">{test.title}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">{test.description}</p>
                {count > 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-700">{count} domande disponibili</p>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 active:bg-slate-50 transition"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current">
              <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm8.5 1.8h-8.5A3.96 3.96 0 0 0 3.8 7.75v8.5a3.96 3.96 0 0 0 3.95 3.95h8.5a3.96 3.96 0 0 0 3.95-3.95v-8.5a3.96 3.96 0 0 0-3.95-3.95ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Zm5.4-3.15a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
            </svg>
            <span>{siteConfig.instagramLabel}</span>
          </a>
        </div>
      </div>
    </main>
  );
}
