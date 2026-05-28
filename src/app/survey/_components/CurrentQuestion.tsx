import styles from "@/app/survey/_components/survey-flow.module.css";
import type {
  AddSurveyResponse,
  FrontendSurveyQuestion,
  SurveyAnswerValue,
} from "@/types/survey";
import DataSelection from "./data-source-selections/data-selection";

type CurrentQuestionProps = {
  addResponse: AddSurveyResponse;
  answer: SurveyAnswerValue;
  question: FrontendSurveyQuestion;
};

export function CurrentQuestion({
  addResponse,
  question,
  answer,
}: CurrentQuestionProps) {
  const isRequired = question.required;

  switch (question.type) {
    case "TEXTAREA":
      return (
        <label className={styles.field}>
          <span>Type your answer</span>
          <textarea
            onChange={(event) => addResponse(question.id, event.target.value)}
            required={isRequired}
            value={typeof answer === "string" ? answer : ""}
          />
        </label>
      );
    case "NUMBER":
      return (
        <label className={styles.field}>
          <span>Enter a number</span>
          <input
            onChange={(event) => addResponse(question.id, event.target.value)}
            required={isRequired}
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
            onChange={(event) => addResponse(question.id, event.target.value)}
            required={isRequired}
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
            onChange={(event) => addResponse(question.id, event.target.value)}
            required={isRequired}
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
            onChange={(event) => addResponse(question.id, event.target.value)}
            required={isRequired}
            value={typeof answer === "string" ? answer : ""}
          >
            <option value="">Choose an option</option>
            {question.comboOptions.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className={styles.emptyState}>
          This question has no options yet. Ask an admin to finish configuring
          it.
        </p>
      );
    case "BOOLEAN":
      return (
        <label className={styles.field}>
          <span>Select one option</span>
          <select
            onChange={(event) => addResponse(question.id, event.target.value)}
            required={isRequired}
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
                checked={answer === option.label}
                onChange={(event) => addResponse(question.id, event.target.value)}
                required={isRequired}
                type="radio"
                value={option.label}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>
          This question has no options yet. Ask an admin to finish configuring
          it.
        </p>
      );
    case "CHECKBOX":
      return question.comboOptions.length ? (
        <div className={styles.optionList}>
          {question.comboOptions.map((option) => {
            const selectedValues = Array.isArray(answer) ? answer : [];
            const nextValues = selectedValues.includes(option.label)
              ? selectedValues.filter((item) => item !== option.label)
              : [...selectedValues, option.label];

            return (
              <label className={styles.optionLabel} key={option.id}>
                <input
                  checked={selectedValues.includes(option.label)}
                  onChange={() => addResponse(question.id, nextValues)}
                  type="checkbox"
                  value={option.label}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className={styles.emptyState}>
          This question has no options yet. Ask an admin to finish configuring
          it.
        </p>
      );
    case "SEARCH_SELECT":
      if (question.datasource) {
        return (
          <DataSelection
            answer={typeof answer === "string" ? answer : ""}
            addResponse={addResponse}
            questionId={question.id}
            source={question.datasource}
          />
        );
      }
    case "TEXT":
    default:
      return (
        <label className={styles.field}>
          <span>Type your answer</span>
          <input
            onChange={(event) => addResponse(question.id, event.target.value)}
            required={isRequired}
            type="text"
            value={typeof answer === "string" ? answer : ""}
          />
        </label>
      );
  }
}
