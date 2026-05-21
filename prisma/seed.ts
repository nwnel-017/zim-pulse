import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { City, Country } from "country-state-city";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const CITY_BATCH_SIZE = 1000;

function parseCoordinate(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseFloat(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function buildCityKey(name: string, stateCode?: string | null): string {
  return `${stateCode ?? ""}::${name.trim().toLowerCase()}`;
}

async function seedCountriesAndCities() {
  const countries = Country.getAllCountries();
  let insertedCountries = 0;
  let insertedCities = 0;

  for (const country of countries) {
    const savedCountry = await prisma.country.upsert({
      where: {
        isoCode: country.isoCode,
      },
      update: {
        name: country.name,
        phoneCode: country.phonecode || null,
        currency: country.currency || null,
        emoji: country.flag || null,
      },
      create: {
        name: country.name,
        isoCode: country.isoCode,
        phoneCode: country.phonecode || null,
        currency: country.currency || null,
        emoji: country.flag || null,
      },
    });

    insertedCountries += 1;

    const packageCities = City.getCitiesOfCountry(country.isoCode) ?? [];
    if (packageCities.length === 0) {
      continue;
    }

    const existingCities = await prisma.city.findMany({
      where: {
        countryId: savedCountry.id,
      },
      select: {
        name: true,
        stateCode: true,
      },
    });

    const existingCityKeys = new Set(
      existingCities.map((city) => buildCityKey(city.name, city.stateCode)),
    );

    const newCities = packageCities
      .filter((city) => !existingCityKeys.has(buildCityKey(city.name, city.stateCode)))
      .map((city) => ({
        name: city.name,
        countryId: savedCountry.id,
        stateCode: city.stateCode || null,
        latitude: parseCoordinate(city.latitude),
        longitude: parseCoordinate(city.longitude),
        population: null,
      }));

    for (let index = 0; index < newCities.length; index += CITY_BATCH_SIZE) {
      const batch = newCities.slice(index, index + CITY_BATCH_SIZE);

      if (batch.length === 0) {
        continue;
      }

      await prisma.city.createMany({
        data: batch,
      });
    }

    insertedCities += newCities.length;
  }

  console.log(
    `Seed complete. Upserted ${insertedCountries} countries and inserted ${insertedCities} new cities.`,
  );
}

seedCountriesAndCities()
  .catch((error) => {
    console.error("Seeding failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
