"use server";

import { revalidatePath } from "next/cache";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import { requireUserSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
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

function serializeCheckboxAnswers(values: string[]) {
  return JSON.stringify(values);
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
    await prisma.surveyResponse.deleteMany({
      where: {
        questionId: question.id,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    return createSurveyActionSuccess();
  }

  let answerToSave: string;
  let cityIdToSave: string | null = null;

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

    answerToSave = serializeCheckboxAnswers(values);
  } else if (question.type === SurveyQuestionType.SEARCH_SELECT) {
    if (!isSearchSelectAnswer(input.answer)) {
      return createSurveyActionError("Invalid answer.");
    }

    const validationResult = surveyTextAnswerSchema.safeParse(input.answer.label);

    if (!validationResult.success) {
      return createSurveyActionError("Invalid answer.");
    }

    if (question.datasource === SurveyQuestionDataSource.CITY) {
      if (!input.answer.selectedId) {
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
          id: input.answer.selectedId,
        },
      });

      if (!city) {
        return createSurveyActionError(
          `A valid city must be selected for "${question.prompt}".`,
        );
      }

      answerToSave = formatCityAnswer(city);
      cityIdToSave = city.id;
    } else {
      answerToSave = validationResult.data;
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
    }

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

    answerToSave = answer;
  }

  const existingResponse = await prisma.surveyResponse.findUnique({
    where: {
      userId_questionId: {
        questionId: question.id,
        userId: session.user.id,
      },
    },
  });

  if (existingResponse) {
    await prisma.surveyResponse.update({
      data: {
        answer: answerToSave,
        cityId: cityIdToSave,
      },
      where: {
        id: existingResponse.id,
      },
    });
  } else {
    await prisma.surveyResponse.create({
      data: {
        answer: answerToSave,
        cityId: cityIdToSave,
        questionId: question.id,
        userId: session.user.id,
      },
    });
  }

  revalidatePath("/dashboard");
  return createSurveyActionSuccess();
}
