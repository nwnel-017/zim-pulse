import styles from "@/app/survey/_components/survey-flow.module.css";
import DataSelection from "./data-source-selections/data-selection";
import { SurveyQuestionDataSource } from "@/generated/prisma/enums";

type SurveyQuestionOption = {
  id: string;
  label: string;
};

export type SurveyQuestion = {
  comboOptions: SurveyQuestionOption[];
  id: string;
  prompt: string;
  type: string;
  datasource: SurveyQuestionDataSource | null;
};

type CurrentQuestionProps = {
  question: SurveyQuestion;
  answer: string | string[];
  setSingleAnswer: (questionId: string, value: string) => void;
  toggleCheckboxAnswer: (questionId: string, value: string) => void;
};

export function CurrentQuestion({
  question,
  answer,
  setSingleAnswer,
  toggleCheckboxAnswer,
}: CurrentQuestionProps) {
  switch (question.type) {
    case "TEXTAREA":
      return (
        <label className={styles.field}>
          <span>Type your answer</span>
          <textarea
            name={`question-${question.id}`}
            onChange={(event) =>
              setSingleAnswer(question.id, event.target.value)
            }
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
            onChange={(event) =>
              setSingleAnswer(question.id, event.target.value)
            }
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
            onChange={(event) =>
              setSingleAnswer(question.id, event.target.value)
            }
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
            onChange={(event) =>
              setSingleAnswer(question.id, event.target.value)
            }
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
            onChange={(event) =>
              setSingleAnswer(question.id, event.target.value)
            }
            required
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
            name={`question-${question.id}`}
            onChange={(event) =>
              setSingleAnswer(question.id, event.target.value)
            }
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
                checked={answer === option.label}
                name={`question-${question.id}`}
                onChange={(event) =>
                  setSingleAnswer(question.id, event.target.value)
                }
                required
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

            return (
              <label className={styles.optionLabel} key={option.id}>
                <input
                  checked={selectedValues.includes(option.label)}
                  name={`question-${question.id}`}
                  onChange={() =>
                    toggleCheckboxAnswer(question.id, option.label)
                  }
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
            questionId={question.id}
            setSingleAnswer={setSingleAnswer}
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
            name={`question-${question.id}`}
            onChange={(event) =>
              setSingleAnswer(question.id, event.target.value)
            }
            required
            type="text"
            value={typeof answer === "string" ? answer : ""}
          />
        </label>
      );
  }
}
