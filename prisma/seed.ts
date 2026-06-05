import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import ISO6391 from "iso-639-1";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCities } from "../scripts/seed/geonames/seedCities";
import { seedCountries } from "../scripts/seed/geonames/seedCountries";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function normalizeOptionalString(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

async function seedLanguages() {
  const languageCodes = ISO6391.getAllCodes();
  let upsertedLanguages = 0;

  for (const code of languageCodes) {
    await prisma.language.upsert({
      where: {
        iso6391: code,
      },
      update: {
        iso6391: code,
        localName: normalizeOptionalString(ISO6391.getNativeName(code)),
        name: ISO6391.getName(code),
      },
      create: {
        iso6391: code,
        localName: normalizeOptionalString(ISO6391.getNativeName(code)),
        name: ISO6391.getName(code),
      },
    });

    upsertedLanguages += 1;
  }

  console.log(`Seed complete. Upserted ${upsertedLanguages} languages.`);
}

async function seedDatabase() {
  await seedCountries(prisma);
  await seedCities(prisma);
  await seedLanguages();
}

seedDatabase()
  .catch((error) => {
    console.error("Seeding failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
