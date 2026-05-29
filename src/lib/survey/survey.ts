import { prisma } from "@/lib/prisma/prisma";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import type {
  EditableSurveyResponseQuestion,
  SurveyAnswerValue,
} from "@/types/survey";

export async function getSurveyQuestions() {
  return prisma.surveyQuestion.findMany({
    include: {
      comboOptions: {
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
}

export async function getIncompleteSurveyQuestions(userId: string) {
  const [questions, responses] = await Promise.all([
    getSurveyQuestions(),
    prisma.surveyResponse.findMany({
      distinct: ["questionId"],
      select: {
        questionId: true,
      },
      where: {
        userId,
      },
    }),
  ]);

  const answeredQuestionIds = new Set(
    responses.map((response) => response.questionId),
  );

  return questions.filter((question) => !answeredQuestionIds.has(question.id));
}

function deserializeSurveyAnswer(
  datasource: SurveyQuestionDataSource | null,
  questionType: SurveyQuestionType,
  answer: string | null,
  cityId: string | null,
): SurveyAnswerValue {
  if (questionType === SurveyQuestionType.SEARCH_SELECT) {
    return {
      label: answer ?? "",
      selectedId:
        datasource === SurveyQuestionDataSource.CITY ? cityId : null,
    };
  }

  if (questionType !== SurveyQuestionType.CHECKBOX) {
    return answer ?? "";
  }

  if (!answer) {
    return [];
  }

  try {
    const parsedAnswer = JSON.parse(answer);

    if (
      Array.isArray(parsedAnswer) &&
      parsedAnswer.every((value) => typeof value === "string")
    ) {
      return parsedAnswer;
    }
  } catch (error) {
    console.log("Failed to parse checkbox survey answer", error);
  }

  return [];
}

export async function getSurveyResponseSummary(userId: string) {
  const responseSummary = await prisma.surveyResponse.aggregate({
    _count: {
      id: true,
    },
    _min: {
      createdAt: true,
    },
    where: {
      userId,
    },
  });

  if (!responseSummary._count.id || !responseSummary._min.createdAt) {
    return null;
  }

  return {
    responseCount: responseSummary._count.id,
    submittedAt: responseSummary._min.createdAt,
  };
}

export async function getAdminSurveyEntries() {
  const surveyResponses = await prisma.surveyResponse.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      createdAt: true,
      userId: true,
      user: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });

  const entriesByUserId = new Map<
    string,
    {
      email: string;
      submittedAt: Date;
      userId: string;
    }
  >();

  for (const response of surveyResponses) {
    if (response.user.role === "admin" || entriesByUserId.has(response.userId)) {
      continue;
    }

    entriesByUserId.set(response.userId, {
      email: response.user.email,
      submittedAt: response.createdAt,
      userId: response.userId,
    });
  }

  return Array.from(entriesByUserId.values()).sort(
    (left, right) => right.submittedAt.getTime() - left.submittedAt.getTime(),
  );
}

export async function getEditableSurveyResponseQuestions(
  userId: string,
): Promise<EditableSurveyResponseQuestion[]> {
  const [questions, responses] = await Promise.all([
    getSurveyQuestions(),
    prisma.surveyResponse.findMany({
      select: {
        answer: true,
        cityId: true,
        questionId: true,
      },
      where: {
        userId,
      },
    }),
  ]);

  const responsesByQuestionId = new Map(
    responses.map((response) => [response.questionId, response]),
  );

  return questions.map((question) => ({
    comboOptions: question.comboOptions.map((option) => ({
      id: option.id,
      label: option.label,
    })),
    currentAnswer: deserializeSurveyAnswer(
      question.datasource,
      question.type,
      responsesByQuestionId.get(question.id)?.answer ?? null,
      responsesByQuestionId.get(question.id)?.cityId ?? null,
    ),
    datasource: question.datasource,
    id: question.id,
    prompt: question.prompt,
    required: question.required,
    type: question.type,
  }));
}

export async function userNeedsSurvey(userId: string) {
  const incompleteQuestions = await getIncompleteSurveyQuestions(userId);

  return incompleteQuestions.some((question) => question.required);
}
