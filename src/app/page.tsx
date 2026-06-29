import { QuizApp } from "@/components/quiz-app";
import { loadAllQuizSources } from "@/lib/quiz-parser";
import { tests } from "@/config/contest";

export default async function Home() {
  const allQuestions = await loadAllQuizSources(tests);
  return <QuizApp allQuestions={allQuestions} />;
}
