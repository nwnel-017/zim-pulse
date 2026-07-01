"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ComponentType, MutableRefObject } from "react";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";
import type { GlobeCityPoint } from "@/types/survey";
import styles from "./globe-canvas.module.css";

type GlobeCanvasProps = {
  emptyDescription?: string;
  emptyTitle?: string;
  error?: string | null;
  loadingDescription?: string;
  loadingTitle?: string;
  points: GlobeCityPoint[];
  renderingDescription?: string;
  renderingTitle?: string;
  isLoading?: boolean;
};

type DynamicGlobeComponent = ComponentType<
  GlobeProps & { ref?: MutableRefObject<GlobeMethods | undefined> }
>;

const GlobeRenderer = dynamic(() => import("react-globe.gl"), {
  loading: () => null,
  ssr: false,
}) as DynamicGlobeComponent;

const globeImageUrl = "/globe/cartoon-earth.svg";

function formatTooltip(point: GlobeCityPoint) {
  const userLabel = point.userCount === 1 ? "user" : "users";

  return `<div class="zim-globe-tooltip"><strong>${point.cityName}</strong><br />${point.countryName}<br />${point.userCount} ${userLabel}</div>`;
}

function getPointAltitude(point: GlobeCityPoint, maxUserCount: number) {
  return 0.025 + (point.userCount / maxUserCount) * 0.13;
}

export default function GlobeCanvas({
  emptyDescription = "The globe will populate after data points are available.",
  emptyTitle = "NO CITY POINTS AVAILABLE",
  error = null,
  isLoading = false,
  loadingDescription = "Fetching city data and preparing the 3D view.",
  loadingTitle = "LOADING GLOBE",
  points,
  renderingDescription = "Plotting city markers on the 3D map.",
  renderingTitle = "RENDERING GLOBE",
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });
  const [readyPointsSignature, setReadyPointsSignature] = useState<
    string | null
  >(null);

  const pointsSignature = useMemo(
    () =>
      points
        .map((point) => `${point.cityId}:${point.userCount}:${point.lat}:${point.lng}`)
        .join("|"),
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
  const isGlobeReady = readyPointsSignature === pointsSignature;

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
    setReadyPointsSignature(pointsSignature);

    if (!globeRef.current) {
      return;
    }

    globeRef.current.pointOfView({ altitude: 2.2, lat: 16, lng: 8 }, 1200);
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enablePan = false;
  }

  return (
    <div className={styles.frame} ref={containerRef}>
      {!isLoading &&
      !error &&
      points.length > 0 &&
      dimensions.width > 0 &&
      dimensions.height > 0 ? (
        <div className={styles.canvas}>
          <GlobeRenderer
            ref={globeRef}
            atmosphereAltitude={0.055}
            atmosphereColor="#edbd2c"
            backgroundColor="rgba(0,0,0,0)"
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
            pointRadius={0.24}
            pointResolution={8}
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
            <h2 className="type-display-base type-display-value">
              {loadingTitle}
            </h2>
            <p className="type-lead">{loadingDescription}</p>
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
            <h2 className="type-display-base type-display-value">{emptyTitle}</h2>
            <p className="type-lead">{emptyDescription}</p>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && points.length > 0 && !isGlobeReady ? (
        <div className={styles.overlay}>
          <div>
            <h2 className="type-display-base type-display-value">
              {renderingTitle}
            </h2>
            <p className="type-lead">{renderingDescription}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
