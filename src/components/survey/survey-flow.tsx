"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialSurveyActionState,
  type SurveyActionState,
} from "@/app/survey/action-state";
import {
  CurrentQuestion,
  type SurveyQuestion,
} from "@/app/survey/_components/CurrentQuestion";
import styles from "@/components/survey/survey-flow.module.css";

type SurveyFlowProps = {
  action: (
    previousState: SurveyActionState,
    formData: FormData,
  ) => Promise<SurveyActionState>;
  questionCount: number;
  questions: SurveyQuestion[];
  userName: string;
};

type SurveyAnswers = Record<string, string | string[]>;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-button" disabled={pending} type="submit">
      {pending ? "Submitting..." : "Submit survey"}
    </button>
  );
}

export function SurveyFlow({
  action,
  questionCount,
  questions,
  userName,
}: SurveyFlowProps) {
  const [state, formAction] = useActionState(action, initialSurveyActionState);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(() =>
    Object.fromEntries(
      questions.map((question) => [
        question.id,
        question.type === "CHECKBOX" ? [] : "",
      ]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questionCount) * 100;

  if (!currentQuestion) {
    return null;
  }

  function setSingleAnswer(questionId: string, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }));
  }

  function toggleCheckboxAnswer(questionId: string, value: string) {
    setAnswers((currentAnswers) => {
      const existingValue = currentAnswers[questionId];
      const currentSelection = Array.isArray(existingValue)
        ? existingValue
        : [];

      return {
        ...currentAnswers,
        [questionId]: currentSelection.includes(value)
          ? currentSelection.filter((item) => item !== value)
          : [...currentSelection, value],
      };
    });
  }

  function hasAnswer(question: SurveyQuestion) {
    const answer = answers[question.id];

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    return typeof answer === "string" && answer.trim().length > 0;
  }

  function moveToNextStep() {
    if (!hasAnswer(currentQuestion)) {
      setError("Complete this question before moving to the next step.");
      return;
    }

    setError(null);
    setCurrentStep((step) => step + 1);
  }

  function moveToPreviousStep() {
    setError(null);
    setCurrentStep((step) => step - 1);
  }

  return (
    <form action={formAction} className={styles.surveyFlow}>
      <div className={styles.copy}>
        <p className="eyebrow">Survey</p>
        <h1>Complete your profile before entering the dashboard.</h1>
        <p className="lead">
          {userName}, answer each question step by step. Your responses will be
          saved when you submit the final step.
        </p>
      </div>

      <div className={styles.meta}>
        <p className="lead">
          Question {currentStep + 1} of {questionCount}
        </p>
        <div className={styles.progressRow}>
          <p className={styles.progressLabel}>Progress</p>
          <div aria-hidden="true" className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.questionCard}>
        <p className={styles.questionPrompt}>{currentQuestion.prompt}</p>
        <CurrentQuestion
          answer={answers[currentQuestion.id]}
          question={currentQuestion}
          setSingleAnswer={setSingleAnswer}
          toggleCheckboxAnswer={toggleCheckboxAnswer}
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {!error && state.error ? (
        <p className={styles.error}>{state.error}</p>
      ) : null}

      <div className={styles.actions}>
        <button
          className={styles.secondaryAction}
          disabled={currentStep === 0}
          onClick={moveToPreviousStep}
          type="button"
        >
          Previous
        </button>

        {isLastStep ? (
          <SubmitButton />
        ) : (
          <button
            className="auth-button"
            onClick={moveToNextStep}
            type="button"
          >
            Next question
          </button>
        )}
      </div>
    </form>
  );
}
