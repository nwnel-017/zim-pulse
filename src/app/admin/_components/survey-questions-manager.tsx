import { createSurveyQuestion } from "@/app/admin/actions";
import { DeleteSurveyQuestionForm } from "@/app/admin/_components/delete-survey-question-form";
import { SurveyQuestionCreator } from "@/app/admin/_components/survey-question-creator";
import { SurveyQuestionEditor } from "@/app/admin/_components/survey-question-editor";
import { surveyQuestionTypeLabels } from "@/lib/survey/question-types";
import type { getSurveyQuestions } from "@/lib/survey/survey";

type SurveyQuestionsManagerProps = {
  surveyQuestions: Awaited<ReturnType<typeof getSurveyQuestions>>;
};

export function SurveyQuestionsManager({
  surveyQuestions,
}: SurveyQuestionsManagerProps) {
  return (
    <>
      <section className="admin-section">
        <div className="admin-section-copy">
          <p className="eyebrow">Add Question</p>
          <h2>Create a survey question</h2>
        </div>

        <SurveyQuestionCreator action={createSurveyQuestion} />
      </section>
      <section className="admin-section">
        <div className="admin-section-copy">
          <p className="eyebrow">Survey Builder</p>
          <h2>All survey questions</h2>
        </div>

        {surveyQuestions.length ? (
          <ol className="admin-question-list">
            {surveyQuestions.map((question) => (
              <li className="admin-question-card" key={question.id}>
                <p className="admin-question-order">
                  Question order: {question.sortOrder}
                </p>
                <p className="admin-question-type">
                  {surveyQuestionTypeLabels[question.type]}
                </p>
                <p className="admin-question-type">
                  {question.required
                    ? "Required question"
                    : "Optional question"}
                </p>
                <p className="admin-question-prompt">{question.prompt}</p>
                <div className="admin-question-actions">
                  <SurveyQuestionEditor
                    comboOptions={question.comboOptions.map((option) => ({
                      id: option.id,
                      label: option.label,
                    }))}
                    prompt={question.prompt}
                    questionId={question.id}
                    required={question.required}
                    sortOrder={question.sortOrder}
                    type={question.type}
                  />

                  <DeleteSurveyQuestionForm questionId={question.id} />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="admin-empty-state">
            No survey questions have been added yet.
          </p>
        )}
      </section>
    </>
  );
}
