import { prisma } from "@/lib/prisma/prisma";

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

export async function userNeedsSurvey(userId: string) {
  const incompleteQuestions = await getIncompleteSurveyQuestions(userId);

  return incompleteQuestions.some((question) => question.required);
}
