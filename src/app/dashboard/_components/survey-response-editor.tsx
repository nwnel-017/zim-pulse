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
    return answer.length ? answer.join(", ") : "No response saved.";
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
      <p className={styles.questionPrompt}>{question.prompt}</p>
      <p className={styles.answerPreview}>
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
        <summary className="auth-button ghost-button admin-inline-button">
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
              className="auth-button"
              disabled={isPending}
              onClick={handleSave}
              type="button"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
            <button
              className="auth-button ghost-button"
              disabled={isPending}
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </button>
          </div>

          {state.error ? <p className="auth-error">{state.error}</p> : null}
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
          className="auth-button ghost-button"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Edit response
        </button>
      </div>
    );
  }

  return (
    <section className={styles.editorSection}>
      <div className={styles.editorCopy}>
        <h3 className={styles.editorTitle}>Edit your saved responses</h3>
        <p className={styles.editorDescription}>
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
        className={`auth-button ghost-button ${styles.closeButton}`}
        onClick={() => setIsEditing(false)}
        type="button"
      >
        Done editing
      </button>
    </section>
  );
}
