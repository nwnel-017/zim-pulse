import { NextResponse } from "next/server";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import { requireUserSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import type { GlobeCityPoint } from "@/types/survey";

function comparePoints(left: GlobeCityPoint, right: GlobeCityPoint) {
  if (right.userCount !== left.userCount) {
    return right.userCount - left.userCount;
  }

  return left.cityName.localeCompare(right.cityName);
}

export async function GET() {
  await requireUserSession();

  const responses = await prisma.surveyResponse.findMany({
    distinct: ["userId", "cityId"],
    select: {
      city: {
        select: {
          country: {
            select: {
              name: true,
            },
          },
          id: true,
          latitude: true,
          longitude: true,
          name: true,
        },
      },
      cityId: true,
    },
    where: {
      cityId: {
        not: null,
      },
      question: {
        datasource: SurveyQuestionDataSource.CITY,
        type: SurveyQuestionType.SEARCH_SELECT,
      },
    },
  });

  const pointsByCityId = new Map<string, GlobeCityPoint>();

  for (const response of responses) {
    if (
      !response.cityId ||
      !response.city ||
      response.city.latitude === null ||
      response.city.longitude === null
    ) {
      continue;
    }

    const existingPoint = pointsByCityId.get(response.cityId);

    if (existingPoint) {
      existingPoint.userCount += 1;
      continue;
    }

    pointsByCityId.set(response.cityId, {
      cityId: response.city.id,
      cityName: response.city.name,
      countryName: response.city.country.name,
      lat: response.city.latitude,
      lng: response.city.longitude,
      userCount: 1,
    });
  }

  const points = [...pointsByCityId.values()].sort(comparePoints);

  return NextResponse.json({ points });
}
