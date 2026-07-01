"use client";

import { useEffect, useMemo, useState } from "react";
import GlobeCanvas from "@/components/globe/GlobeCanvas";
import type { GlobeCityPoint } from "@/types/survey";
import styles from "./user-insights-globe-section.module.css";

type UsersByCityResponse = {
  points: GlobeCityPoint[];
};

export default function UserInsightsGlobeSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<GlobeCityPoint[]>([]);

  const totalUsers = useMemo(
    () => points.reduce((sum, point) => sum + point.userCount, 0),
    [points],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadPoints() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/user-insights/users-by-city", {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load city data.");
        }

        const payload = (await response.json()) as UsersByCityResponse;

        if (!controller.signal.aborted) {
          setPoints(payload.points ?? []);
        }
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setPoints([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load city data.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPoints();

    return () => controller.abort();
  }, []);

  return (
    <section className={styles.shell} aria-labelledby="user-insights-heading">
      <div className={styles.copy}>
        <h1
          className={`${styles.heading} type-display-base type-display-page-title`}
          id="user-insights-heading"
        >
          WHERE ARE USERS LOCATED?
        </h1>
        <span className={styles.rule} aria-hidden="true" />
        <p className={`${styles.description} type-lead`}>
          A city-level view of saved survey responses.
        </p>
      </div>

      <div className={styles.stats} aria-label="User insights statistics">
        <div className={styles.statCard}>
          <strong className={`${styles.statValue} type-display-base type-display-value`}>
            {points.length}
          </strong>
          <span className={`${styles.statLabel} type-action-display type-stat-label`}>
            CITIES
          </span>
        </div>
        <div className={styles.statCard}>
          <strong className={`${styles.statValue} type-display-base type-display-value`}>
            {totalUsers}
          </strong>
          <span className={`${styles.statLabel} type-action-display type-stat-label`}>
            MAPPED USERS
          </span>
        </div>
      </div>

      <GlobeCanvas
        emptyDescription="The globe will populate after users save survey responses with valid city records."
        error={error}
        isLoading={isLoading}
        points={points}
      />
    </section>
  );
}
