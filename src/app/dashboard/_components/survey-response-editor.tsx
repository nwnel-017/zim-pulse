"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { initialSurveyActionState } from "@/app/survey/action-state";
import { CurrentQuestion } from "@/app/survey/_components/CurrentQuestion";
import { updateSurveyResponse } from "@/app/dashboard/actions";
import type { SurveyActionState } from "@/app/survey/action-state";
import type {
  EditableSurveyResponseQuestion,
  SurveyAnswerValue,
} from "@/types/survey";
import styles from "./survey-response-editor.module.css";

type SurveyResponseEditorProps = {
  questions: EditableSurveyResponseQuestion[];
};

type SurveyResponseEditorRowProps = {
  question: EditableSurveyResponseQuestion;
};

// TO DO - unnecessary type SurveyAnswerValue - just string | string[]
// TO DO - move SurveyResponseEditorRow to child component
function formatAnswer(answer: SurveyAnswerValue) {
  if (Array.isArray(answer)) {
    if (!answer.length) {
      return "No response saved.";
    }

    return answer
      .map((value) => typeof value === "string" ? value : value.label)
      .join(", ");
  }

  if (typeof answer === "string") {
    return answer.trim().length ? answer : "No response saved.";
  }

  return answer.label.trim().length ? answer.label : "No response saved.";
}

function SurveyResponseEditorRow({ question }: SurveyResponseEditorRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answer, setAnswer] = useState<SurveyAnswerValue>(
    question.currentAnswer,
  );
  const [state, setState] = useState<SurveyActionState>(
    initialSurveyActionState,
  );
  const [isOpen, setIsOpen] = useState(false);

  function handleSave() {
    startTransition(async () => {
      const nextState = await updateSurveyResponse({
        answer,
        questionId: question.id,
      });

      setState(nextState);

      if (nextState.success) {
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  function handleCancel() {
    setAnswer(question.currentAnswer);
    setState(initialSurveyActionState);
    setIsOpen(false);
  }

  return (
    <li className={styles.questionCard}>
      <p className="type-lead">{question.prompt}</p>
      <p className={`${styles.answerPreview} type-body-small`}>
        Current response:{" "}
        <span
          className={
            formatAnswer(question.currentAnswer) === "No response saved."
              ? styles.emptyAnswer
              : undefined
          }
        >
          {formatAnswer(question.currentAnswer)}
        </span>
      </p>

      <details
        className="admin-question-editor"
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
        open={isOpen}
      >
        <summary className="auth-button ghost-button admin-inline-button type-button-label">
          Edit response
        </summary>

        <div className={styles.editorForm}>
          <CurrentQuestion
            addResponse={(_questionId, value) => setAnswer(value)}
            answer={answer}
            question={question}
          />

          <div className="admin-inline-actions">
            <button
              className="auth-button type-button-label"
              disabled={isPending}
              onClick={handleSave}
              type="button"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
            <button
              className="auth-button ghost-button type-button-label"
              disabled={isPending}
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </button>
          </div>

          {state.error ? (
            <p className="auth-error type-form-message">{state.error}</p>
          ) : null}
        </div>
      </details>
    </li>
  );
}

export default function SurveyResponseEditor({
  questions,
}: SurveyResponseEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className={styles.closeButton}>
        <button
          className={`${styles.primaryButton} type-button-label`}
          onClick={() => setIsEditing(true)}
          type="button"
        >
          VIEW SUBMISSION
        </button>
      </div>
    );
  }

  return (
    <section className={styles.editorSection}>
      <div className={styles.editorCopy}>
        <h3 className="type-section-title">
          Edit your saved responses
        </h3>
        <p className={`${styles.editorDescription} type-body-small`}>
          Update any answer below and save each question individually.
        </p>
      </div>

      <ul className={styles.questionList}>
        {questions.map((question) => (
          <SurveyResponseEditorRow
            key={`${question.id}:${JSON.stringify(question.currentAnswer)}`}
            question={question}
          />
        ))}
      </ul>

      <button
        className={`${styles.primaryButton} ${styles.closeButton} type-button-label`}
        onClick={() => setIsEditing(false)}
        type="button"
      >
        Done editing
      </button>
    </section>
  );
}
