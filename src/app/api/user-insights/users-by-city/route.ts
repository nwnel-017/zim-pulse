import { NextResponse } from "next/server";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import { getSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { redirect } from "next/navigation";
import { userNeedsSurvey } from "@/lib/survey/survey";
import type { GlobeCityPoint } from "@/types/survey";

function comparePoints(left: GlobeCityPoint, right: GlobeCityPoint) {
  if (right.userCount !== left.userCount) {
    return right.userCount - left.userCount;
  }

  return left.cityName.localeCompare(right.cityName);
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "admin" && (await userNeedsSurvey(session.user.id))) {
    redirect("/survey");
  }

  const answers = await prisma.surveyAnswer.findMany({
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
      submissionId: true,
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
  const seenSubmissionCityKeys = new Set<string>();

  for (const answer of answers) {
    if (
      !answer.cityId ||
      !answer.city ||
      answer.city.latitude === null ||
      answer.city.longitude === null
    ) {
      continue;
    }

    const submissionCityKey = `${answer.submissionId}:${answer.cityId}`;

    if (seenSubmissionCityKeys.has(submissionCityKey)) {
      continue;
    }

    seenSubmissionCityKeys.add(submissionCityKey);

    const existingPoint = pointsByCityId.get(answer.cityId);

    if (existingPoint) {
      existingPoint.userCount += 1;
      continue;
    }

    pointsByCityId.set(answer.cityId, {
      cityId: answer.city.id,
      cityName: answer.city.name,
      countryName: answer.city.country.name,
      lat: answer.city.latitude,
      lng: answer.city.longitude,
      userCount: 1,
    });
  }

  const points = [...pointsByCityId.values()].sort(comparePoints);

  return NextResponse.json({ points });
}
