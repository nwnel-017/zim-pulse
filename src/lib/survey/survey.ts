import { prisma } from "@/lib/prisma/prisma";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import {
  getResponseMode,
  responseModes,
  type ResponseModeValue,
} from "@/lib/survey/response-mode";
import type {
  EditableSurveyResponseQuestion,
  SurveyAnswerValue,
} from "@/types/survey";

type SurveyQuestionRecord = {
  comboOptions: Array<{
    id: string;
    label: string;
  }>;
  datasource: SurveyQuestionDataSource | null;
  id: string;
  prompt: string;
  required: boolean;
  responseMode?: ResponseModeValue | null;
  type: SurveyQuestionType;
};

type StoredSurveyAnswer = {
  booleanValue: boolean | null;
  cityId: string | null;
  languageId: string | null;
  numberValue: number | null;
  questionId: string;
  textValue: string | null;
};

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
  }) as Promise<SurveyQuestionRecord[]>;
}

export async function getIncompleteSurveyQuestions(userId: string) {
  const [questions, submission] = await Promise.all([
    getSurveyQuestions(),
    prisma.surveySubmission.findUnique({
      select: {
        surveyAnswers: {
          select: {
            questionId: true,
          },
        },
      },
      where: {
        userId,
      },
    }),
  ]);

  const answeredQuestionIds = new Set(
    submission?.surveyAnswers.map((answer) => answer.questionId) ?? [],
  );

  return questions.filter((question) => !answeredQuestionIds.has(question.id));
}

function deserializeSurveyAnswer(
  datasource: SurveyQuestionDataSource | null,
  responseMode: ResponseModeValue,
  questionType: SurveyQuestionType,
  answers: StoredSurveyAnswer[] = [],
): SurveyAnswerValue {
  const firstAnswer = answers[0];

  if (questionType === SurveyQuestionType.SEARCH_SELECT) {
    return {
      label: firstAnswer?.textValue ?? "",
      selectedId: datasource === SurveyQuestionDataSource.CITY
        ? (firstAnswer?.cityId ?? null)
        : datasource === SurveyQuestionDataSource.LANGUAGE
          ? (firstAnswer?.languageId ?? null)
          : null,
    };
  }

  if (questionType === SurveyQuestionType.CHECKBOX) {
    return answers
      .map((answer) => answer.textValue)
      .filter((value): value is string => value !== null);
  }

  if (!firstAnswer) {
    return "";
  }

  if (responseMode === responseModes.MULTIPLE) {
    return answers
      .map((answer) => answer.textValue)
      .filter((value): value is string => value !== null);
  }

  if (questionType === SurveyQuestionType.BOOLEAN) {
    if (firstAnswer.booleanValue === null) {
      return "";
    }

    return firstAnswer.booleanValue ? "yes" : "no";
  }

  if (questionType === SurveyQuestionType.NUMBER) {
    if (firstAnswer.numberValue === null) {
      return "";
    }

    return String(firstAnswer.numberValue);
  }

  return firstAnswer.textValue ?? "";
}

export async function getSurveyResponseSummary(userId: string) {
  const submission = await prisma.surveySubmission.findUnique({
    select: {
      createdAt: true,
      surveyAnswers: {
        select: {
          questionId: true,
        },
      },
    },
    where: {
      userId,
    },
  });

  if (!submission) {
    return null;
  }

  return {
    responseCount: new Set(
      submission.surveyAnswers.map((answer) => answer.questionId),
    ).size,
    submittedAt: submission.createdAt,
  };
}

export async function getAdminSurveyEntryByUserId(userId: string) {
  return prisma.user.findFirst({
    select: {
      email: true,
      id: true,
      role: true,
    },
    where: {
      id: userId,
    },
  });
}

export async function getAdminSurveyEntries() {
  const submissions = await prisma.surveySubmission.findMany({
    orderBy: {
      createdAt: true,
    },
    select: {
      createdAt: true,
      userId: true,
      user: {
        select: {
          email: true,
          id: true,
          role: true,
        },
      },
    },
  });

  return submissions
    .filter((submission) => submission.user.role !== "admin")
    .map((submission) => ({
      email: submission.user.email,
      submittedAt: submission.createdAt,
      userId: submission.userId,
    }))
    .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime());
}

export async function getEditableSurveyResponseQuestions(
  userId: string,
): Promise<EditableSurveyResponseQuestion[]> {
  const [questions, submission] = await Promise.all([
    getSurveyQuestions(),
    prisma.surveySubmission.findUnique({
      select: {
        surveyAnswers: {
          orderBy: [
            {
              createdAt: "asc",
            },
            {
              id: "asc",
            },
          ],
          select: {
            booleanValue: true,
            cityId: true,
            languageId: true,
            numberValue: true,
            questionId: true,
            textValue: true,
          },
        },
      },
      where: {
        userId,
      },
    }),
  ]);

  const answersByQuestionId = new Map<string, StoredSurveyAnswer[]>();

  for (const answer of submission?.surveyAnswers ?? []) {
    const groupedAnswers = answersByQuestionId.get(answer.questionId);

    if (groupedAnswers) {
      groupedAnswers.push(answer);
      continue;
    }

    answersByQuestionId.set(answer.questionId, [answer]);
  }

  return questions.map((question) => ({
    comboOptions: question.comboOptions.map((option) => ({
      id: option.id,
      label: option.label,
    })),
    currentAnswer: deserializeSurveyAnswer(
      question.datasource,
      getResponseMode(question),
      question.type,
      answersByQuestionId.get(question.id) ?? [],
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
