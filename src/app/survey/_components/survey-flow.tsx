"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { SurveyActionState } from "@/app/survey/action-state";
import { CurrentQuestion } from "@/app/survey/_components/CurrentQuestion";
import { AppHeader } from "@/components/ui/AppHeader";
import styles from "@/app/survey/_components/survey-flow.module.css";
import {
  SurveyQuestionDataSource,
  SurveyResponseMode,
} from "@/generated/prisma/enums";
import { questionTypeSupportsResponseMode } from "@/lib/survey/response-mode";
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
    if (
      questionTypeSupportsResponseMode(question.type)
      && question.responseMode === SurveyResponseMode.MULTI_SELECT
    ) {
      return [];
    }

    return {
      label: "",
      selectedId: null,
    } satisfies SearchSelectAnswer;
  }

  return "";
}

function getSearchSelectAnswerSelectedId(answer: SurveyAnswers[string]) {
  if (
    typeof answer === "object"
    && answer !== null
    && !Array.isArray(answer)
    && "selectedId" in answer
  ) {
    return answer.selectedId;
  }

  return null;
}

export function SurveyFlow({
  action,
  questionCount,
  questions,
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

  const countryQuestion = questions.find(
    (question) => question.datasource === SurveyQuestionDataSource.COUNTRY,
  );
  const selectedCountryId = countryQuestion
    ? getSearchSelectAnswerSelectedId(surveyResponses[countryQuestion.id])
    : null;
  const previousSelectedCountryId = useRef<string | null>(selectedCountryId);
  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questionCount) * 100;

  useEffect(() => {
    if (previousSelectedCountryId.current === selectedCountryId) {
      return;
    }

    previousSelectedCountryId.current = selectedCountryId;

    setSurveyResponses((currentResponses) => ({
      ...currentResponses,
      ...Object.fromEntries(
        questions
          .filter(
            (question) => question.datasource === SurveyQuestionDataSource.CITY,
          )
          .map((question) => [question.id, createInitialSurveyAnswer(question)]),
      ),
    }));
  }, [questions, selectedCountryId]);

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
      setError(
        isLastStep
          ? "Complete this question before submitting the survey."
          : "Complete this question before moving to the next step.",
      );
      return;
    }

    setError(null);

    if (!isLastStep) {
      setCurrentStep((step) => step + 1);
      return;
    }

    submitResponses(surveyResponses);
  }

  return (
    <form className={styles.surveyFlow} onSubmit={handleSubmit}>
      <AppHeader ariaLabel="Survey navigation" />

      <div className={styles.surveyContent}>
        <div className={styles.questionArea}>
          <p className={styles.kicker}>survey</p>

          <div className={styles.stepGroup}>
            <p className={styles.stepLabel}>
              question {currentStep + 1} of {questionCount}
            </p>
            <span aria-hidden="true" className={styles.stepRule} />
          </div>

          <section aria-labelledby="survey-question" className={styles.questionCard}>
            <h1 className={styles.questionPrompt} id="survey-question">
              {currentQuestion.prompt}
            </h1>
            <p className={styles.questionHelp}>
              Select one of the options below
            </p>
            <CurrentQuestion
              addResponse={addResponse}
              answer={surveyResponses[currentQuestion.id]}
              key={currentQuestion.id}
              question={currentQuestion}
              selectedCountryId={selectedCountryId}
            />
          </section>
        </div>

        <div className={styles.footerArea}>
          <div className={styles.progressRow}>
            <p className={styles.progressLabel}>
              {currentStep + 1} / {questionCount}
            </p>
            <div
              aria-label={`Survey progress: ${currentStep + 1} of ${questionCount}`}
              aria-valuemax={questionCount}
              aria-valuemin={1}
              aria-valuenow={currentStep + 1}
              className={styles.progressTrack}
              role="progressbar"
            >
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
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
              PREVIOUS
            </button>

            <button
              className={styles.primaryAction}
              disabled={pending}
              onClick={isLastStep ? undefined : moveToNextStep}
              type={isLastStep ? "submit" : "button"}
            >
              {isLastStep ? (pending ? "SUBMITTING..." : "SUBMIT") : "NEXT"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
