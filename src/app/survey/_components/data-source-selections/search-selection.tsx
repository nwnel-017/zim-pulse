"use client";

import { useEffect, useState } from "react";
import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import type {
  AddSurveyResponse,
  SearchSelectAnswer,
  SurveySearchResponse,
  SurveySearchResult,
} from "@/types/survey";
import styles from "./data-selection.module.css";

function isSearchSelectAnswer(
  value: SearchSelectAnswer | SearchSelectAnswer[],
): value is SearchSelectAnswer {
  return !Array.isArray(value);
}

function isSameSelection(left: SearchSelectAnswer, right: SearchSelectAnswer) {
  if (left.selectedId && right.selectedId) {
    return left.selectedId === right.selectedId;
  }

  return left.label === right.label;
}

type SearchSelectionProps = {
  allowMultiple: boolean;
  answer: SearchSelectAnswer | SearchSelectAnswer[];
  addResponse: AddSurveyResponse;
  emptyStateText: string;
  loadingText: string;
  placeholder: string;
  questionId: string;
  searchLabel: string;
  showMeta: boolean;
  source: SurveyQuestionDataSource;
};

export default function SearchSelection({
  allowMultiple,
  answer,
  addResponse,
  emptyStateText,
  loadingText,
  placeholder,
  questionId,
  searchLabel,
  showMeta,
  source,
}: SearchSelectionProps) {
  const [query, setQuery] = useState(
    !allowMultiple && isSearchSelectAnswer(answer) ? answer.label : "",
  );
  const [results, setResults] = useState<SurveySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const selectedAnswers = allowMultiple
    ? Array.isArray(answer)
      ? answer
      : []
    : [];

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/survey-search?source=${source}&q=${encodeURIComponent(trimmedQuery)}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as SurveySearchResponse;

        if (!response.ok) {
          throw new Error(
            payload.message || `Unable to search ${searchLabel.toLowerCase()}.`,
          );
        }

        setResults(payload.results || []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setResults([]);
        setSearchError(
          error instanceof Error
            ? error.message
            : `Unable to search ${searchLabel.toLowerCase()}.`,
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, searchLabel, source]);

  function handleSelect(result: SurveySearchResult) {
    const nextAnswer = {
      label: result.value,
      selectedId: result.id,
    };

    if (allowMultiple) {
      if (selectedAnswers.some((item) => isSameSelection(item, nextAnswer))) {
        setQuery("");
        setResults([]);
        setSearchError(null);
        return;
      }

      addResponse(questionId, [...selectedAnswers, nextAnswer]);
      setQuery("");
      setResults([]);
      setSearchError(null);
      return;
    }

    setQuery(result.label);
    setResults([]);
    setSearchError(null);
    addResponse(questionId, nextAnswer);
  }

  function handleRemoveSelection(answerToRemove: SearchSelectAnswer) {
    if (!allowMultiple) {
      return;
    }

    addResponse(
      questionId,
      selectedAnswers.filter((item) => !isSameSelection(item, answerToRemove)),
    );
  }

  return (
    <div className={styles.selectionField}>
      <label className={styles.searchField}>
        <span>{searchLabel}</span>
        <input
          autoComplete="off"
          className={styles.searchInput}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setResults([]);
            setIsLoading(false);
            setSearchError(null);

            if (!allowMultiple) {
              addResponse(questionId, {
                label: nextQuery,
                selectedId: null,
              });
            }
          }}
          placeholder={placeholder}
          type="text"
          value={query}
        />
      </label>

      {allowMultiple && selectedAnswers.length ? (
        <ul className={styles.selectedList}>
          {selectedAnswers.map((selectedAnswer, index) => (
            <li
              className={styles.selectedItem}
              key={`${selectedAnswer.selectedId ?? selectedAnswer.label}:${index}`}
            >
              <span className={styles.selectedText}>
                {selectedAnswer.label}
              </span>
              <button
                className={styles.removeSelectedButton}
                onClick={() => handleRemoveSelection(selectedAnswer)}
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {isLoading ? <p className={styles.statusText}>{loadingText}</p> : null}

      {searchError ? <p className={styles.statusText}>{searchError}</p> : null}

      {!isLoading &&
      !searchError &&
      query.trim().length > 0 &&
      query.trim().length < 2 ? (
        <p className={styles.statusText}>
          Enter at least 2 characters to search.
        </p>
      ) : null}

      {!isLoading &&
      !searchError &&
      query.trim().length >= 2 &&
      !results.length ? (
        <p className={styles.statusText}>{emptyStateText}</p>
      ) : null}

      {results.length ? (
        <ul className={styles.resultsList}>
          {results.map((result) => (
            <li key={result.id}>
              <button
                className={styles.resultButton}
                onClick={() => handleSelect(result)}
                type="button"
              >
                <span>{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!allowMultiple && isSearchSelectAnswer(answer) && answer.label ? (
        <p className={styles.selectedText}>Selected: {answer.label}</p>
      ) : null}
    </div>
  );
}
