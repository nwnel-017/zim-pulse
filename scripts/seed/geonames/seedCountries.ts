import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { parse } from "csv-parse";
import type { PrismaClient } from "../../../src/generated/prisma/client";

const COUNTRY_INFO_FILE = new URL("../../../data/geonames/countryInfo.txt", import.meta.url);

const COUNTRY_INFO_INDEX = {
  COUNTRY_NAME: 4,
  CURRENCY_CODE: 10,
  ISO_CODE: 0,
  PHONE_CODE: 12,
} as const;

function normalizeOptionalString(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizePhoneCode(value: string | undefined): string | null {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.startsWith("+")
    ? normalizedValue
    : `+${normalizedValue}`;
}

function getFlagEmoji(isoCode: string): string | null {
  if (!/^[A-Z]{2}$/.test(isoCode)) {
    return null;
  }

  const [firstLetter, secondLetter] = isoCode;

  if (!firstLetter || !secondLetter) {
    return null;
  }

  return String.fromCodePoint(
    firstLetter.charCodeAt(0) + 127397,
    secondLetter.charCodeAt(0) + 127397,
  );
}

export async function seedCountries(prisma: PrismaClient) {
  await access(COUNTRY_INFO_FILE);

  const existingCountryIsoCodes = new Set(
    (await prisma.country.findMany({
      select: {
        isoCode: true,
      },
    })).map((country) => country.isoCode),
  );

  const parser = createReadStream(COUNTRY_INFO_FILE).pipe(
    parse({
      comment: "#",
      delimiter: "\t",
      quote: false,
      relax_column_count: true,
      trim: true,
    }),
  );

  let insertedCountries = 0;
  let processedCountries = 0;
  let skippedCountries = 0;
  let updatedCountries = 0;

  for await (const record of parser as AsyncIterable<string[]>) {
    const isoCode = normalizeOptionalString(record[COUNTRY_INFO_INDEX.ISO_CODE])?.toUpperCase();
    const countryName = normalizeOptionalString(record[COUNTRY_INFO_INDEX.COUNTRY_NAME]);

    if (!isoCode || !countryName) {
      skippedCountries += 1;
      continue;
    }

    await prisma.country.upsert({
      where: {
        isoCode,
      },
      update: {
        currency: normalizeOptionalString(record[COUNTRY_INFO_INDEX.CURRENCY_CODE]),
        emoji: getFlagEmoji(isoCode),
        name: countryName,
        phoneCode: normalizePhoneCode(record[COUNTRY_INFO_INDEX.PHONE_CODE]),
      },
      create: {
        currency: normalizeOptionalString(record[COUNTRY_INFO_INDEX.CURRENCY_CODE]),
        emoji: getFlagEmoji(isoCode),
        isoCode,
        name: countryName,
        phoneCode: normalizePhoneCode(record[COUNTRY_INFO_INDEX.PHONE_CODE]),
      },
    });

    if (existingCountryIsoCodes.has(isoCode)) {
      updatedCountries += 1;
    } else {
      existingCountryIsoCodes.add(isoCode);
      insertedCountries += 1;
    }

    processedCountries += 1;
  }

  console.log(
    `Countries seeded from GeoNames. Processed ${processedCountries}, inserted ${insertedCountries}, updated ${updatedCountries}, skipped ${skippedCountries}.`,
  );
}
