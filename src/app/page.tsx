import { QuizApp } from "@/components/quiz-app";
import { loadQuizSource } from "@/lib/quiz-parser";

export default async function Home() {
  const quizSource = await loadQuizSource();

  return <QuizApp questions={quizSource.questions} />;
}
