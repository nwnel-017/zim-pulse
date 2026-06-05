"use client";

import { useState, useTransition } from "react";
import type { SurveyActionState } from "@/app/survey/action-state";
import { CurrentQuestion } from "@/app/survey/_components/CurrentQuestion";
import styles from "@/app/survey/_components/survey-flow.module.css";
import { SurveyResponseMode } from "@/generated/prisma/enums";
import {
  type FrontendSurveyQuestion,
  type SearchSelectAnswer,
  type SurveyAnswers,
} from "@/types/survey";

type SurveyFlowProps = {
  action: (surveyResponses: SurveyAnswers) => Promise<SurveyActionState>;
  questionCount: number;
  questions: FrontendSurveyQuestion[];
  userName: string;
};

function createInitialSurveyAnswer(question: FrontendSurveyQuestion) {
  if (question.type === "CHECKBOX") {
    return [];
  }

  if (question.type === "SEARCH_SELECT") {
    if (question.responseMode === SurveyResponseMode.MULTI_SELECT) {
      return [];
    }

    return {
      label: "",
      selectedId: null,
    } satisfies SearchSelectAnswer;
  }

  return "";
}

export function SurveyFlow({
  action,
  questionCount,
  questions,
  userName,
}: SurveyFlowProps) {
  const [pending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyResponses, setSurveyResponses] = useState<SurveyAnswers>(() =>
    Object.fromEntries(
      questions.map((question) => [
        question.id,
        createInitialSurveyAnswer(question),
      ]),
    ),
  );
  const [state, setState] = useState<SurveyActionState>({
    success: false,
    error: null,
  });
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questionCount) * 100;

  if (!currentQuestion) {
    return null;
  }

  function addResponse(questionId: string, value: SurveyAnswers[string]) {
    setSurveyResponses((currentResponses) => ({
      ...currentResponses,
      [questionId]: value,
    }));
  }

  function hasAnswer(question: FrontendSurveyQuestion) {
    const answer = surveyResponses[question.id];

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    if (typeof answer === "string") {
      return answer.trim().length > 0;
    }

    return answer.label.trim().length > 0 && answer.selectedId !== null;
  }

  function canLeaveQuestion(question: FrontendSurveyQuestion) {
    return !question.required || hasAnswer(question);
  }

  function submitResponses(nextResponses: SurveyAnswers) {
    startTransition(async () => {
      const nextState = await action(nextResponses);
      setState(nextState);
    });
  }

  function moveToNextStep() {
    if (!canLeaveQuestion(currentQuestion)) {
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

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canLeaveQuestion(currentQuestion)) {
      setError("Complete this question before submitting the survey.");
      return;
    }

    setError(null);
    submitResponses(surveyResponses);
  }

  function handleSkipQuestion() {
    if (currentQuestion.required) {
      return;
    }

    setError(null);

    if (isLastStep) {
      submitResponses(surveyResponses);
      return;
    }

    setCurrentStep((step) => step + 1);
  }

  return (
    <form className={styles.surveyFlow} onSubmit={handleSubmit}>
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
          addResponse={addResponse}
          answer={surveyResponses[currentQuestion.id]}
          question={currentQuestion}
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {!error && state.error ? (
        <p className={styles.error}>{state.error}</p>
      ) : null}

      <div className={styles.actions}>
        <button
          className={styles.secondaryAction}
          disabled={currentStep === 0 || pending}
          onClick={moveToPreviousStep}
          type="button"
        >
          Previous
        </button>

        {!currentQuestion.required && !isLastStep ? (
          <button
            className={styles.secondaryAction}
            disabled={pending}
            onClick={handleSkipQuestion}
            type="button"
          >
            Skip
          </button>
        ) : null}

        {isLastStep ? (
          <button className="auth-button" disabled={pending} type="submit">
            {pending ? "Submitting..." : "Submit survey"}
          </button>
        ) : (
          <button
            className="auth-button"
            disabled={pending}
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
