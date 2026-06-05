"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/admin/action-state";
import { initialActionState } from "@/app/admin/action-state";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import { surveyQuestionTypeLabels } from "@/lib/survey/question-types";
import styles from "@/app/admin/_components/survey-question-creator.module.css";
import DataSourceOptions from "./data-source-options";

type SurveyQuestionCreatorProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
};

const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="auth-button" disabled={pending} type="submit">
      {pending ? "Adding..." : "Add survey question"}
    </button>
  );
}

type SurveyQuestionCreatorFormProps = {
  action: (formData: FormData) => void;
  error: string | null;
};

function SurveyQuestionCreatorForm({
  action,
  error,
}: SurveyQuestionCreatorFormProps) {
  const [questionType, setQuestionType] = useState<SurveyQuestionType>(
    SurveyQuestionType.TEXT,
  );
  const [dataSource, setDataSource] = useState<SurveyQuestionDataSource>(
    SurveyQuestionDataSource.COUNTRY,
  );
  const [optionLabels, setOptionLabels] = useState(["", ""]);

  const showsChoices = selectableQuestionTypes.has(questionType);
  const showDataSources = questionType === SurveyQuestionType.SEARCH_SELECT;
  const showAllowMultipleAnswers = questionType === SurveyQuestionType.CHECKBOX
    || questionType === SurveyQuestionType.SEARCH_SELECT;

  function updateOptionLabel(index: number, value: string) {
    setOptionLabels((currentLabels) =>
      currentLabels.map((label, currentIndex) =>
        currentIndex === index ? value : label,
      ),
    );
  }

  function addOptionLabel() {
    setOptionLabels((currentLabels) => [...currentLabels, ""]);
  }

  function removeOptionLabel(index: number) {
    setOptionLabels((currentLabels) =>
      currentLabels.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  return (
    <form action={action} className={`auth-form ${styles.creatorForm}`}>
      <label className="auth-field">
        <span>Question prompt</span>
        <input
          name="prompt"
          placeholder="What should we ask the user?"
          required
          type="text"
        />
      </label>

      <label className="auth-field">
        <span>Question type</span>
        <select
          className="auth-select"
          name="type"
          onChange={(event) =>
            setQuestionType(event.target.value as SurveyQuestionType)
          }
          value={questionType}
        >
          {Object.values(SurveyQuestionType).map((type) => (
            <option key={type} value={type}>
              {surveyQuestionTypeLabels[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field">
        <span>Question order</span>
        <input
          defaultValue="0"
          min="0"
          name="sortOrder"
          required
          type="number"
        />
      </label>

      {showsChoices ? (
        <section className={styles.choicePanel}>
          <div className={styles.choiceHeader}>
            <span className="eyebrow">Selection Choices</span>
            <p>Add the choices users should see for this question.</p>
          </div>

          <div className={styles.choiceList}>
            {optionLabels.map((label, index) => (
              <div
                className={styles.choiceRow}
                key={`${questionType}-${index}`}
              >
                <label className="auth-field">
                  <span>Choice {index + 1}</span>
                  <input
                    className={styles.choiceInput}
                    name="optionLabel"
                    onChange={(event) =>
                      updateOptionLabel(index, event.target.value)
                    }
                    placeholder={`Enter choice ${index + 1}`}
                    required={showsChoices}
                    type="text"
                    value={label}
                  />
                </label>

                {optionLabels.length > 2 ? (
                  <button
                    className={`auth-button ghost-button ${styles.removeButton}`}
                    onClick={() => removeOptionLabel(index)}
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className={styles.choiceActions}>
            <button
              className="auth-button ghost-button"
              onClick={addOptionLabel}
              type="button"
            >
              Add another choice
            </button>
          </div>
        </section>
      ) : showDataSources ? (
        <DataSourceOptions
          onDataSourceChange={setDataSource}
          required={showDataSources}
          selectedDataSource={dataSource}
        />
      ) : null}

      {showAllowMultipleAnswers ? (
        <label className={styles.checkboxField}>
          <input
            className={styles.checkboxInput}
            name="allowMultipleAnswers"
            type="checkbox"
            value="true"
          />
          <span>Allow multiple answers</span>
        </label>
      ) : null}

      <SubmitButton />
      {error ? <p className="auth-error">{error}</p> : null}
    </form>
  );
}

export function SurveyQuestionCreator({ action }: SurveyQuestionCreatorProps) {
  const [state, formAction] = useActionState(action, initialActionState);

  return <SurveyQuestionCreatorForm action={formAction} error={state.error} />;
}
