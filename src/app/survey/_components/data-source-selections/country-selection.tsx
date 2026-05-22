"use client";

import { useEffect, useState } from "react";
import styles from "./data-selection.module.css";

type SearchResult = {
  id: string;
  label: string;
  meta: string;
  value: string;
};

type CountrySelectionProps = {
  answer: string;
  questionId: string;
  setSingleAnswer: (questionId: string, value: string) => void;
};

export default function CountrySelection({
  answer,
  questionId,
  setSingleAnswer,
}: CountrySelectionProps) {
  const [query, setQuery] = useState(answer);
  const [results, setResults] = useState<SearchResult[]>([]);
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

        const payload = (await response.json()) as {
          message?: string;
          results?: SearchResult[];
        };

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

  function handleSelect(result: SearchResult) {
    setQuery("");
    setResults([]);
    setSearchError(null);
    setSingleAnswer(questionId, result.value);
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
            setSingleAnswer(questionId, "");
          }}
          placeholder="Start typing a country name"
          type="text"
          value={query}
        />
      </label>

      <input name={`question-${questionId}`} type="hidden" value={answer} />

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
