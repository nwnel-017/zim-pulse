"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import styles from "@/components/survey/survey-flow.module.css";

type SurveyQuestionOption = {
  id: string;
  label: string;
  value: string;
};

type SurveyQuestion = {
  comboOptions: SurveyQuestionOption[];
  id: string;
  prompt: string;
  type: string;
};

type SurveyFlowProps = {
  action: (formData: FormData) => void | Promise<void>;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(() =>
    Object.fromEntries(
      questions.map((question) => [question.id, question.type === "CHECKBOX" ? [] : ""]),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questionCount) * 100;

  function setSingleAnswer(questionId: string, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: value,
    }));
  }

  function toggleCheckboxAnswer(questionId: string, value: string) {
    setAnswers((currentAnswers) => {
      const existingValue = currentAnswers[questionId];
      const currentSelection = Array.isArray(existingValue) ? existingValue : [];

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

  function renderQuestionInput(question: SurveyQuestion) {
    const answer = answers[question.id];

    switch (question.type) {
      case "TEXTAREA":
        return (
          <label className={styles.field}>
            <span>Type your answer</span>
            <textarea
              name={`question-${question.id}`}
              onChange={(event) => setSingleAnswer(question.id, event.target.value)}
              required
              value={typeof answer === "string" ? answer : ""}
            />
          </label>
        );
      case "NUMBER":
        return (
          <label className={styles.field}>
            <span>Enter a number</span>
            <input
              name={`question-${question.id}`}
              onChange={(event) => setSingleAnswer(question.id, event.target.value)}
              required
              step="any"
              type="number"
              value={typeof answer === "string" ? answer : ""}
            />
          </label>
        );
      case "EMAIL":
        return (
          <label className={styles.field}>
            <span>Email address</span>
            <input
              name={`question-${question.id}`}
              onChange={(event) => setSingleAnswer(question.id, event.target.value)}
              required
              type="email"
              value={typeof answer === "string" ? answer : ""}
            />
          </label>
        );
      case "DATE":
        return (
          <label className={styles.field}>
            <span>Select a date</span>
            <input
              name={`question-${question.id}`}
              onChange={(event) => setSingleAnswer(question.id, event.target.value)}
              required
              type="date"
              value={typeof answer === "string" ? answer : ""}
            />
          </label>
        );
      case "DROPDOWN":
        return question.comboOptions.length ? (
          <label className={styles.field}>
            <span>Select one option</span>
            <select
              name={`question-${question.id}`}
              onChange={(event) => setSingleAnswer(question.id, event.target.value)}
              required
              value={typeof answer === "string" ? answer : ""}
            >
              <option value="">Choose an option</option>
              {question.comboOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className={styles.emptyState}>
            This question has no options yet. Ask an admin to finish configuring it.
          </p>
        );
      case "BOOLEAN":
        return (
          <label className={styles.field}>
            <span>Select one option</span>
            <select
              name={`question-${question.id}`}
              onChange={(event) => setSingleAnswer(question.id, event.target.value)}
              required
              value={typeof answer === "string" ? answer : ""}
            >
              <option value="">Choose an option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        );
      case "RADIO":
        return question.comboOptions.length ? (
          <div className={styles.optionList}>
            {question.comboOptions.map((option) => (
              <label className={styles.optionLabel} key={option.id}>
                <input
                  checked={answer === option.value}
                  name={`question-${question.id}`}
                  onChange={(event) => setSingleAnswer(question.id, event.target.value)}
                  required
                  type="radio"
                  value={option.value}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            This question has no options yet. Ask an admin to finish configuring it.
          </p>
        );
      case "CHECKBOX":
        return question.comboOptions.length ? (
          <div className={styles.optionList}>
            {question.comboOptions.map((option) => {
              const selectedValues = Array.isArray(answer) ? answer : [];

              return (
                <label className={styles.optionLabel} key={option.id}>
                  <input
                    checked={selectedValues.includes(option.value)}
                    name={`question-${question.id}`}
                    onChange={() => toggleCheckboxAnswer(question.id, option.value)}
                    type="checkbox"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyState}>
            This question has no options yet. Ask an admin to finish configuring it.
          </p>
        );
      case "TEXT":
      default:
        return (
          <label className={styles.field}>
            <span>Type your answer</span>
            <input
              name={`question-${question.id}`}
              onChange={(event) => setSingleAnswer(question.id, event.target.value)}
              required
              type="text"
              value={typeof answer === "string" ? answer : ""}
            />
          </label>
        );
    }
  }

  return (
    <form action={action} className={styles.surveyFlow}>
      <div className={styles.copy}>
        <p className="eyebrow">Survey</p>
        <h1>Complete your profile before entering the dashboard.</h1>
        <p className="lead">
          {userName}, answer each question step by step. Your responses will be saved
          when you submit the final step.
        </p>
      </div>

      <div className={styles.meta}>
        <p className="lead">
          Question {currentStep + 1} of {questionCount}
        </p>
        <div className={styles.progressRow}>
          <p className={styles.progressLabel}>Progress</p>
          <div aria-hidden="true" className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {questions.map((question) => {
        const hidden = question.id !== currentQuestion.id;

        return (
          <div
            aria-hidden={hidden}
            className={styles.questionCard}
            hidden={hidden}
            key={question.id}
          >
            <p className={styles.questionPrompt}>{question.prompt}</p>
            {renderQuestionInput(question)}
          </div>
        );
      })}

      {error ? <p className={styles.error}>{error}</p> : null}

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
          <button className="auth-button" onClick={moveToNextStep} type="button">
            Next question
          </button>
        )}
      </div>
    </form>
  );
}
