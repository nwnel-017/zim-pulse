import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { parse } from "csv-parse";
import type { PrismaClient } from "../../../src/generated/prisma/client";

const CITIES_500_FILE = new URL("../../../data/geonames/cities500.txt", import.meta.url);
const CITY_BATCH_SIZE = 1000;

const ALL_COUNTRIES_INDEX = {
  ADMIN1_CODE: 10,
  COUNTRY_CODE: 8,
  FEATURE_CLASS: 6,
  LATITUDE: 4,
  LONGITUDE: 5,
  NAME: 1,
  POPULATION: 14,
} as const;

function normalizeOptionalString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function parseCoordinate(value: string | undefined): number | null {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parsePopulation(value: string | undefined): number | null {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function buildCityKey(input: {
  countryId: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  stateCode: string | null;
}) {
  return [
    input.countryId,
    input.stateCode ?? "",
    input.name.trim().toLowerCase(),
    input.latitude?.toFixed(5) ?? "",
    input.longitude?.toFixed(5) ?? "",
  ].join("::");
}

type CityCreateInput = {
  countryId: string;
  dedupeKey: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  population: number | null;
  stateCode: string | null;
};

export async function seedCities(prisma: PrismaClient) {
  await access(CITIES_500_FILE);

  const countries = await prisma.country.findMany({
    select: {
      id: true,
      isoCode: true,
    },
  });
  const countryIdByIsoCode = new Map(
    countries.map((country) => [country.isoCode, country.id]),
  );

  const parser = createReadStream(CITIES_500_FILE).pipe(
    parse({
      delimiter: "\t",
      quote: false,
      relax_column_count: true,
      trim: true,
    }),
  );

  const bufferedCities: CityCreateInput[] = [];
  let insertedCities = 0;
  let processedRows = 0;
  let skippedInvalidRows = 0;
  let skippedMissingCountries = 0;
  let skippedNonPopulatedPlaces = 0;

  async function flushCities() {
    if (bufferedCities.length === 0) {
      return;
    }

    const result = await prisma.city.createMany({
      data: bufferedCities,
      skipDuplicates: true,
    });

    insertedCities += result.count;
    bufferedCities.length = 0;
  }

  for await (const record of parser as AsyncIterable<string[]>) {
    processedRows += 1;

    if (record[ALL_COUNTRIES_INDEX.FEATURE_CLASS] !== "P") {
      skippedNonPopulatedPlaces += 1;
      continue;
    }

    const countryCode = normalizeOptionalString(record[ALL_COUNTRIES_INDEX.COUNTRY_CODE])?.toUpperCase();
    const name = normalizeOptionalString(record[ALL_COUNTRIES_INDEX.NAME]);

    if (!countryCode || !name) {
      skippedInvalidRows += 1;
      continue;
    }

    const countryId = countryIdByIsoCode.get(countryCode);

    if (!countryId) {
      skippedMissingCountries += 1;
      continue;
    }

    const latitude = parseCoordinate(record[ALL_COUNTRIES_INDEX.LATITUDE]);
    const longitude = parseCoordinate(record[ALL_COUNTRIES_INDEX.LONGITUDE]);
    const stateCode = normalizeOptionalString(record[ALL_COUNTRIES_INDEX.ADMIN1_CODE]);

    const city = {
      countryId,
      dedupeKey: buildCityKey({
        countryId,
        latitude,
        longitude,
        name,
        stateCode,
      }),
      latitude,
      longitude,
      name,
      population: parsePopulation(record[ALL_COUNTRIES_INDEX.POPULATION]),
      stateCode,
    } satisfies CityCreateInput;
    bufferedCities.push(city);

    if (bufferedCities.length >= CITY_BATCH_SIZE) {
      await flushCities();
    }
  }

  await flushCities();

  console.log(
    `Cities seeded from GeoNames. Processed ${processedRows}, inserted ${insertedCities}, skipped non-populated ${skippedNonPopulatedPlaces}, skipped invalid ${skippedInvalidRows}, skipped missing country ${skippedMissingCountries}.`,
  );
}
