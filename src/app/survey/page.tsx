import { redirect } from "next/navigation";
import { submitSurveyResponses } from "@/app/survey/actions";
import { SurveyFlow } from "@/app/survey/_components/survey-flow";
import { AppHeader } from "@/components/ui/AppHeader";
import styles from "@/app/survey/_components/survey-flow.module.css";
import { requireSurveySession } from "@/lib/auth/middleware";
import { getIncompleteSurveyQuestions } from "@/lib/survey/survey";
import type { FrontendSurveyQuestion } from "@/types/survey";

export default async function SurveyPage() {
  const session = await requireSurveySession();
  const questions = await getIncompleteSurveyQuestions(session.user.id);

  if (!questions.length) {
    redirect("/dashboard");
  }

  const serializedQuestions: FrontendSurveyQuestion[] = questions.map(
    (question) => ({
      comboOptions: question.comboOptions.map((option) => ({
        id: option.id,
        label: option.label,
      })),
      datasource: question.datasource,
      id: question.id,
      prompt: question.prompt,
      required: question.required,
      responseMode: question.responseMode,
      type: question.type,
    }),
  );

  return (
    <main className="page">
      <AppHeader ariaLabel="Survey navigation" />

      <section className={styles.surveyPanel}>
        <SurveyFlow
          action={submitSurveyResponses}
          questionCount={serializedQuestions.length}
          questions={serializedQuestions}
          userName={session.user.name}
        />
      </section>
    </main>
  );
}
