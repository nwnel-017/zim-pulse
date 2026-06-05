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

type SearchSelectionProps = {
  answer: SearchSelectAnswer;
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
  const [query, setQuery] = useState(answer.label);
  const [results, setResults] = useState<SurveySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
          throw new Error(payload.message || `Unable to search ${searchLabel.toLowerCase()}.`);
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
    setQuery(result.label);
    setResults([]);
    setSearchError(null);
    addResponse(questionId, {
      label: result.value,
      selectedId: result.id,
    });
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
            addResponse(questionId, {
              label: nextQuery,
              selectedId: null,
            });
          }}
          placeholder={placeholder}
          type="text"
          value={query}
        />
      </label>

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
                {showMeta && result.meta ? (
                  <span className={styles.resultMeta}>{result.meta}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {answer.label ? (
        <p className={styles.selectedText}>Selected: {answer.label}</p>
      ) : null}
    </div>
  );
}
