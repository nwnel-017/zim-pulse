"use client";

import { useEffect, useState } from "react";
import type {
  AddSurveyResponse,
  SurveySearchResponse,
  SurveySearchResult,
} from "@/types/survey";
import styles from "./data-selection.module.css";

type CountrySelectionProps = {
  answer: string;
  addResponse: AddSurveyResponse;
  questionId: string;
};

export default function CountrySelection({
  answer,
  addResponse,
  questionId,
}: CountrySelectionProps) {
  const [query, setQuery] = useState(answer);
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
          `/api/survey-search?source=COUNTRY&q=${encodeURIComponent(trimmedQuery)}`,
          {
            method: "GET",
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as SurveySearchResponse;

        if (!response.ok) {
          throw new Error(payload.message || "Unable to search countries.");
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
            : "Unable to search countries.",
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
  }, [query]);

  // Review - why is addResponse called in two places?
  function handleSelect(result: SurveySearchResult) {
    setQuery("");
    setResults([]);
    setSearchError(null);
    addResponse(questionId, result.value);
  }

  return (
    <div className={styles.selectionField}>
      <label className={styles.searchField}>
        <span>Search for a country</span>
        <input
          autoComplete="off"
          className={styles.searchInput}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setResults([]);
            setIsLoading(false);
            setSearchError(null);
            addResponse(questionId, "");
          }}
          placeholder="Start typing a country name"
          type="text"
          value={query}
        />
      </label>

      {isLoading ? (
        <p className={styles.statusText}>Searching countries...</p>
      ) : null}

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
        <p className={styles.statusText}>No countries matched your search.</p>
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
                {/* {result.meta ? (
                  <span className={styles.resultMeta}>{result.meta}</span>
                ) : null} */}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {answer ? (
        <p className={styles.selectedText}>Selected: {answer}</p>
      ) : null}
    </div>
  );
}
