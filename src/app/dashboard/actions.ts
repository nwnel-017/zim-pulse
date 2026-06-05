"use server";

import { revalidatePath } from "next/cache";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import { requireUserSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { getResponseMode, responseModes } from "@/lib/survey/response-mode";
import { surveyCheckboxAnswersSchema, surveyTextAnswerSchema } from "@/app/survey/schemas";
import type { SurveyActionState } from "@/app/survey/action-state";
import type { SearchSelectAnswer, SurveyAnswerValue } from "@/types/survey";

const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);
const booleanQuestionValues = new Set(["yes", "no"]);

type UpdateSurveyResponseInput = {
  answer: SurveyAnswerValue;
  questionId: string;
};

function createSurveyActionError(error: string): SurveyActionState {
  return { success: false, error };
}

function createSurveyActionSuccess(): SurveyActionState {
  return { success: true, error: null };
}

function isBlankOptionalAnswer(answer: SurveyAnswerValue | undefined) {
  if (typeof answer === "undefined") {
    return true;
  }

  if (Array.isArray(answer)) {
    return answer.length === 0;
  }

  if (typeof answer === "string") {
    return answer.trim().length === 0;
  }

  return answer.label.trim().length === 0;
}

function isSearchSelectAnswer(
  answer: SurveyAnswerValue,
): answer is SearchSelectAnswer {
  return (
    typeof answer === "object" &&
    answer !== null &&
    !Array.isArray(answer) &&
    "label" in answer &&
    "selectedId" in answer
  );
}

function isSearchSelectAnswerList(
  answer: SurveyAnswerValue,
): answer is SearchSelectAnswer[] {
  return Array.isArray(answer) &&
    answer.every((item) =>
      typeof item === "object" &&
      item !== null &&
      "label" in item &&
      "selectedId" in item
    );
}

function getSearchSelectAnswers(
  answer: SurveyAnswerValue,
  allowMultiple: boolean,
) {
  if (allowMultiple) {
    return isSearchSelectAnswerList(answer) ? answer : null;
  }

  return isSearchSelectAnswer(answer) ? [answer] : null;
}

function formatCityAnswer(city: {
  country: {
    name: string;
  };
  name: string;
  stateCode: string | null;
}) {
  const labelParts = [city.name];

  if (city.stateCode) {
    labelParts.push(city.stateCode);
  }

  labelParts.push(city.country.name);
  return labelParts.join(", ");
}

export async function updateSurveyResponse(
  input: UpdateSurveyResponseInput,
): Promise<SurveyActionState> {
  const session = await requireUserSession();

  const question = await prisma.surveyQuestion.findUnique({
    include: {
      comboOptions: true,
    },
    where: {
      id: input.questionId,
    },
  });

  if (!question) {
    return createSurveyActionError("Survey question not found.");
  }

  if (!question.required && isBlankOptionalAnswer(input.answer)) {
    const submission = await prisma.surveySubmission.findUnique({
      select: {
        id: true,
      },
      where: {
        userId: session.user.id,
      },
    });

    if (submission) {
      await prisma.surveyAnswer.deleteMany({
        where: {
          questionId: question.id,
          submissionId: submission.id,
        },
      });
    }

    revalidatePath("/dashboard");
    return createSurveyActionSuccess();
  }

  const responseMode = getResponseMode(question);
  let answersToSave: Array<{
    booleanValue: boolean | null;
    cityId: string | null;
    languageId: string | null;
    numberValue: number | null;
    textValue: string | null;
  }> = [];

  if (question.type === SurveyQuestionType.CHECKBOX) {
    const validationResult = surveyCheckboxAnswersSchema.safeParse(input.answer);

    if (!validationResult.success) {
      return createSurveyActionError(`A response is required for "${question.prompt}".`);
    }

    const values = validationResult.data;
    const allowedValues = new Set(
      question.comboOptions.map((option) => option.label),
    );

    for (const value of values) {
      if (!allowedValues.has(value)) {
        return createSurveyActionError(
          `An invalid option was submitted for "${question.prompt}".`,
        );
      }
    }

    answersToSave = responseMode === responseModes.MULTIPLE
      ? values.map((value) => ({
          booleanValue: null,
          cityId: null,
          languageId: null,
          numberValue: null,
          textValue: value,
        }))
      : [{
          booleanValue: null,
          cityId: null,
          languageId: null,
          numberValue: null,
          textValue: values[0] ?? null,
        }];
  } else if (question.type === SurveyQuestionType.SEARCH_SELECT) {
    const values = getSearchSelectAnswers(
      input.answer,
      responseMode === responseModes.MULTIPLE,
    );

    if (!values?.length) {
      return createSurveyActionError("Invalid answer.");
    }

    for (const value of values) {
      const validationResult = surveyTextAnswerSchema.safeParse(value.label);

      if (!validationResult.success) {
        return createSurveyActionError("Invalid answer.");
      }
    }

    if (question.datasource === SurveyQuestionDataSource.CITY) {
      answersToSave = [];

      for (const value of values) {
        if (!value.selectedId) {
          return createSurveyActionError(
            `A valid city must be selected for "${question.prompt}".`,
          );
        }

        const city = await prisma.city.findUnique({
          include: {
            country: {
              select: {
                name: true,
              },
            },
          },
          where: {
            id: value.selectedId,
          },
        });

        if (!city) {
          return createSurveyActionError(
            `A valid city must be selected for "${question.prompt}".`,
          );
        }

        answersToSave.push({
          booleanValue: null,
          cityId: city.id,
          languageId: null,
          numberValue: null,
          textValue: formatCityAnswer(city),
        });
      }
    } else if (question.datasource === SurveyQuestionDataSource.LANGUAGE) {
      answersToSave = [];

      for (const value of values) {
        if (!value.selectedId) {
          return createSurveyActionError(
            `A valid language must be selected for "${question.prompt}".`,
          );
        }

        const language = await prisma.language.findUnique({
          where: {
            id: value.selectedId,
          },
        });

        if (!language) {
          return createSurveyActionError(
            `A valid language must be selected for "${question.prompt}".`,
          );
        }

        answersToSave.push({
          booleanValue: null,
          cityId: null,
          languageId: language.id,
          numberValue: null,
          textValue: language.name,
        });
      }
    } else {
      answersToSave = values.map((value) => ({
        booleanValue: null,
        cityId: null,
        languageId: null,
        numberValue: null,
        textValue: value.label,
      }));
    }
  } else {
    const validationResult = surveyTextAnswerSchema.safeParse(input.answer);

    if (!validationResult.success) {
      return createSurveyActionError("Invalid answer.");
    }

    const answer = validationResult.data;

    if (question.type === SurveyQuestionType.BOOLEAN) {
      if (!booleanQuestionValues.has(answer)) {
        return createSurveyActionError(
          `An invalid option was submitted for "${question.prompt}".`,
        );
      }

      answersToSave = [{
        booleanValue: answer === "yes",
        cityId: null,
        languageId: null,
        numberValue: null,
        textValue: null,
      }];
    } else if (question.type === SurveyQuestionType.NUMBER) {
      const numberValue = Number(answer);

      if (!Number.isFinite(numberValue)) {
        return createSurveyActionError(
          `An invalid number was submitted for "${question.prompt}".`,
        );
      }

      answersToSave = [{
        booleanValue: null,
        cityId: null,
        languageId: null,
        numberValue,
        textValue: null,
      }];
    } else {
      if (selectableQuestionTypes.has(question.type)) {
        const allowedValues = new Set(
          question.comboOptions.map((option) => option.label),
        );

        if (!allowedValues.has(answer)) {
          return createSurveyActionError(
            `An invalid option was submitted for "${question.prompt}".`,
          );
        }
      }

      answersToSave = [{
        booleanValue: null,
        cityId: null,
        languageId: null,
        numberValue: null,
        textValue: answer,
      }];
    }
  }

  await prisma.$transaction(async (tx) => {
    const submission = await tx.surveySubmission.upsert({
      create: {
        userId: session.user.id,
      },
      update: {},
      where: {
        userId: session.user.id,
      },
    });

    await tx.surveyAnswer.deleteMany({
      where: {
        questionId: question.id,
        submissionId: submission.id,
      },
    });

    if (answersToSave.length > 0) {
      await tx.surveyAnswer.createMany({
        data: answersToSave.map((answer) => ({
          booleanValue: answer.booleanValue,
          cityId: answer.cityId,
          languageId: answer.languageId,
          numberValue: answer.numberValue,
          questionId: question.id,
          submissionId: submission.id,
          textValue: answer.textValue,
        })),
      });
    }
  });

  revalidatePath("/dashboard");
  return createSurveyActionSuccess();
}
