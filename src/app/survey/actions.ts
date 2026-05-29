"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SurveyActionState } from "@/app/survey/action-state";
import {
  surveyCheckboxAnswersSchema,
  surveyTextAnswerSchema,
} from "@/app/survey/schemas";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import { requireSurveySession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { getIncompleteSurveyQuestions } from "@/lib/survey/survey";
import type { SearchSelectAnswer, SurveyAnswers } from "@/types/survey";

const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);
const booleanQuestionValues = new Set(["yes", "no"]);

function createSurveyActionError(error: string): SurveyActionState {
  return { success: false, error };
}

function isBlankOptionalAnswer(answer: SurveyAnswers[string] | undefined) {
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
  answer: SurveyAnswers[string] | undefined,
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

export async function submitSurveyResponses(
  surveyResponses: SurveyAnswers,
): Promise<SurveyActionState> {
  const session = await requireSurveySession();
  const questions = await getIncompleteSurveyQuestions(session.user.id);

  if (!questions.length) {
    redirect("/dashboard");
  }

  let responsesToCreate: Array<{
    answer: string;
    cityId?: string | null;
    questionId: string;
    userId: string;
  }>;
  try {
    const responseGroups = await Promise.all(
      questions.map(async (question) => {
        const submittedAnswer = surveyResponses[question.id];

        if (!question.required && isBlankOptionalAnswer(submittedAnswer)) {
          return [];
        }

        if (question.type === SurveyQuestionType.CHECKBOX) {
          const validationResult =
            surveyCheckboxAnswersSchema.safeParse(submittedAnswer);

          if (!validationResult.success) {
            console.log("zod validation failed on form");
            throw new Error(`A response is required for "${question.prompt}".`);
          }

          const values = validationResult.data;

          const allowedValues = new Set(
            question.comboOptions.map((option) => option.label),
          );

          for (const value of values) {
            if (!allowedValues.has(value)) {
              throw new Error(
                `An invalid option was submitted for "${question.prompt}".`,
              );
            }
          }

          return [
            {
              answer: serializeCheckboxAnswers(values),
              questionId: question.id,
              userId: session.user.id,
            },
          ];
        }

        if (question.type === SurveyQuestionType.SEARCH_SELECT) {
          if (!isSearchSelectAnswer(submittedAnswer)) {
            throw new Error("Invalid answer.");
          }

          const validationResult = surveyTextAnswerSchema.safeParse(
            submittedAnswer.label,
          );

          if (!validationResult.success) {
            throw new Error("Invalid answer.");
          }

          if (question.datasource === SurveyQuestionDataSource.CITY) {
            if (!submittedAnswer.selectedId) {
              throw new Error(
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
                id: submittedAnswer.selectedId,
              },
            });

            if (!city) {
              throw new Error(
                `A valid city must be selected for "${question.prompt}".`,
              );
            }

            return [
              {
                answer: formatCityAnswer(city),
                cityId: city.id,
                questionId: question.id,
                userId: session.user.id,
              },
            ];
          }

          return [
            {
              answer: validationResult.data,
              cityId: null,
              questionId: question.id,
              userId: session.user.id,
            },
          ];
        }

        const validationResult =
          surveyTextAnswerSchema.safeParse(submittedAnswer);

        if (!validationResult.success) {
          console.log("zod validation failed");
          throw new Error("Invalid answer.");
        }

        const answer = validationResult.data;

        if (question.type === SurveyQuestionType.BOOLEAN) {
          if (!booleanQuestionValues.has(answer)) {
            throw new Error(
              `An invalid option was submitted for "${question.prompt}".`,
            );
          }
        }

        if (selectableQuestionTypes.has(question.type)) {
          const allowedValues = new Set(
            question.comboOptions.map((option) => option.label),
          );

          if (!allowedValues.has(answer)) {
            throw new Error(
              `An invalid option was submitted for "${question.prompt}".`,
            );
          }
        }

        return [
          {
            answer,
            questionId: question.id,
            userId: session.user.id,
          },
        ];
      }),
    );

    responsesToCreate = responseGroups.flat();
  } catch (error) {
    console.log("failed to batch responses: " + error);
    if (error instanceof Error) {
      return createSurveyActionError(error.message);
    } else {
      return createSurveyActionError("Something went wrong");
    }
  }

  if (responsesToCreate.length > 0) {
    await prisma.surveyResponse.createMany({
      data: responsesToCreate,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/survey");
  redirect("/dashboard");
}
