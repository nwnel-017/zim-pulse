"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";
import type { GlobeCityPoint } from "@/types/survey";
import styles from "./globe.module.css";

type UsersByCityResponse = {
  points: GlobeCityPoint[];
};

type DynamicGlobeComponent = React.ComponentType<
  GlobeProps & { ref?: React.MutableRefObject<GlobeMethods | undefined> }
>;

const GlobeRenderer = dynamic(() => import("react-globe.gl"), {
  loading: () => null,
  ssr: false,
}) as DynamicGlobeComponent;

const globeImageUrl = "//unpkg.com/three-globe/example/img/earth-night.jpg";
const bumpImageUrl = "//unpkg.com/three-globe/example/img/earth-topology.png";

function formatTooltip(point: GlobeCityPoint) {
  const userLabel = point.userCount === 1 ? "user" : "users";

  return `<div><strong>${point.cityName}</strong><br />${point.countryName}<br />${point.userCount} ${userLabel}</div>`;
}

function getPointAltitude(point: GlobeCityPoint, maxUserCount: number) {
  return 0.04 + (point.userCount / maxUserCount) * 0.22;
}

export default function Globe() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<GlobeCityPoint[]>([]);

  const totalUsers = useMemo(
    () => points.reduce((sum, point) => sum + point.userCount, 0),
    [points],
  );
  const maxUserCount = useMemo(
    () =>
      points.reduce(
        (currentMax, point) => Math.max(currentMax, point.userCount),
        1,
      ),
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

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setDimensions({
        height: entry.contentRect.height,
        width: entry.contentRect.width,
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  function handleGlobeReady() {
    setIsGlobeReady(true);

    if (!globeRef.current) {
      return;
    }

    globeRef.current.pointOfView({ altitude: 2.2, lat: 16, lng: 8 }, 1200);
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0;
    controls.enablePan = false;
  }

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

      <div className={styles.frame} ref={containerRef}>
        {!isLoading &&
        !error &&
        points.length > 0 &&
        dimensions.width > 0 &&
        dimensions.height > 0 ? (
          <div className={styles.canvas}>
            <GlobeRenderer
              ref={globeRef}
              atmosphereAltitude={0.12}
              atmosphereColor="#edbd2c"
              backgroundColor="rgba(0,0,0,0)"
              bumpImageUrl={bumpImageUrl}
              globeImageUrl={globeImageUrl}
              height={dimensions.height}
              onGlobeReady={handleGlobeReady}
              pointAltitude={(point) =>
                getPointAltitude(point as GlobeCityPoint, maxUserCount)
              }
              pointColor={() => "#edbd2c"}
              pointLabel={(point) => formatTooltip(point as GlobeCityPoint)}
              pointLat="lat"
              pointLng="lng"
              pointRadius={0.32}
              pointResolution={14}
              pointsData={points}
              pointsMerge={false}
              pointsTransitionDuration={600}
              showAtmosphere
              showGraticules={false}
              width={dimensions.width}
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className={styles.overlay}>
            <div>
              <h2 className="type-display-base type-display-value">LOADING GLOBE</h2>
              <p className="type-lead">Fetching city data and preparing the 3D view.</p>
            </div>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className={styles.overlay}>
            <div>
              <h2 className="type-display-base type-display-value">
                UNABLE TO LOAD THE GLOBE
              </h2>
              <p className="type-lead">{error}</p>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && !points.length ? (
          <div className={styles.overlay}>
            <div>
              <h2 className="type-display-base type-display-value">
                NO CITY POINTS AVAILABLE
              </h2>
              <p className="type-lead">
                The globe will populate after users save survey responses with
                valid city records.
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && !error && points.length > 0 && !isGlobeReady ? (
          <div className={styles.overlay}>
            <div>
              <h2 className="type-display-base type-display-value">RENDERING GLOBE</h2>
              <p className="type-lead">Plotting city markers on the 3D map.</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
