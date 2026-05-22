import { NextResponse } from "next/server";
import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import { surveySearchSchema } from "@/app/api/survey-search/schema";
import { requireSurveySession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { getFirstZodIssueMessage } from "@/utils/validation/zod-helpers";

const RESULT_LIMIT = 10;

function createBadRequest(message: string) {
  return NextResponse.json({ message, results: [] }, { status: 400 });
}

export async function GET(request: Request) {
  await requireSurveySession();

  console.log("calling survey search route");

  const { searchParams } = new URL(request.url);
  const validationResult = surveySearchSchema.safeParse({
    q: searchParams.get("q"),
    source: searchParams.get("source"),
  });

  if (!validationResult.success) {
    return createBadRequest(getFirstZodIssueMessage(validationResult.error));
  }

  const { q: query, source } = validationResult.data;

  switch (source) {
    case SurveyQuestionDataSource.COUNTRY: {
      const countries = await prisma.country.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          emoji: true,
          id: true,
          isoCode: true,
          name: true,
        },
        take: RESULT_LIMIT,
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              isoCode: {
                contains: query.toUpperCase(),
              },
            },
          ],
        },
      });

      return NextResponse.json({
        results: countries.map((country) => ({
          id: country.id,
          label: country.name,
          meta: [country.emoji, country.isoCode].filter(Boolean).join(" "),
          value: country.name,
        })),
      });
    }

    case SurveyQuestionDataSource.CITY: {
      const cities = await prisma.city.findMany({
        include: {
          country: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          {
            name: "asc",
          },
          {
            country: {
              name: "asc",
            },
          },
        ],
        take: RESULT_LIMIT,
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      });

      return NextResponse.json({
        results: cities.map((city) => {
          const labelParts = [city.name];

          if (city.stateCode) {
            labelParts.push(city.stateCode);
          }

          labelParts.push(city.country.name);
          const label = labelParts.join(", ");

          return {
            id: city.id,
            label,
            meta: city.country.name,
            value: label,
          };
        }),
      });
    }

    default:
      return createBadRequest("Invalid data source.");
  }
}
