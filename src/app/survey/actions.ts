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
import { getResponseMode, responseModes } from "@/lib/survey/response-mode";
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

function isSearchSelectAnswerList(
  answer: SurveyAnswers[string] | undefined,
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
  answer: SurveyAnswers[string] | undefined,
  allowMultiple: boolean,
) {
  if (allowMultiple) {
    return isSearchSelectAnswerList(answer) ? answer : null;
  }

  return isSearchSelectAnswer(answer) ? [answer] : null;
}

function getSubmittedCountryId(
  questions: Awaited<ReturnType<typeof getIncompleteSurveyQuestions>>,
  surveyResponses: SurveyAnswers,
) {
  const countryQuestion = questions.find(
    (question) => question.datasource === SurveyQuestionDataSource.COUNTRY,
  );

  if (!countryQuestion) {
    return null;
  }

  const countryAnswer = surveyResponses[countryQuestion.id];

  if (!isSearchSelectAnswer(countryAnswer)) {
    return null;
  }

  return countryAnswer.selectedId;
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

  let answersToCreate: Array<{
    booleanValue: boolean | null;
    cityId?: string | null;
    languageId?: string | null;
    numberValue: number | null;
    questionId: string;
    textValue: string | null;
  }>;
  try {
    const submittedCountryId = getSubmittedCountryId(questions, surveyResponses);
    const answerGroups = await Promise.all(
      questions.map(async (question) => {
        const submittedAnswer = surveyResponses[question.id];
        const responseMode = getResponseMode(question);

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

          if (responseMode === responseModes.MULTIPLE) {
            return values.map((value) => ({
              booleanValue: null,
              cityId: null,
              languageId: null,
              numberValue: null,
              questionId: question.id,
              textValue: value,
            }));
          }

          return [{
            booleanValue: null,
            cityId: null,
            languageId: null,
            numberValue: null,
            questionId: question.id,
            textValue: values[0] ?? null,
          }];
        }

        if (question.type === SurveyQuestionType.SEARCH_SELECT) {
          const values = getSearchSelectAnswers(
            submittedAnswer,
            responseMode === responseModes.MULTIPLE,
          );

          if (!values?.length) {
            throw new Error("Invalid answer.");
          }

          for (const value of values) {
            const validationResult = surveyTextAnswerSchema.safeParse(value.label);

            if (!validationResult.success) {
              throw new Error("Invalid answer.");
            }
          }

          if (question.datasource === SurveyQuestionDataSource.CITY) {
            return Promise.all(
              values.map(async (value) => {
                if (!value.selectedId) {
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
                    id: value.selectedId,
                  },
                });

                if (!city) {
                  throw new Error(
                    `A valid city must be selected for "${question.prompt}".`,
                  );
                }

                if (submittedCountryId && city.countryId !== submittedCountryId) {
                  throw new Error(
                    `Select a city in the selected country for "${question.prompt}".`,
                  );
                }

                return {
                  booleanValue: null,
                  cityId: city.id,
                  languageId: null,
                  numberValue: null,
                  questionId: question.id,
                  textValue: formatCityAnswer(city),
                };
              }),
            );
          }

          if (question.datasource === SurveyQuestionDataSource.LANGUAGE) {
            return Promise.all(
              values.map(async (value) => {
                if (!value.selectedId) {
                  throw new Error(
                    `A valid language must be selected for "${question.prompt}".`,
                  );
                }

                const language = await prisma.language.findUnique({
                  where: {
                    id: value.selectedId,
                  },
                });

                if (!language) {
                  throw new Error(
                    `A valid language must be selected for "${question.prompt}".`,
                  );
                }

                return {
                  booleanValue: null,
                  cityId: null,
                  languageId: language.id,
                  numberValue: null,
                  questionId: question.id,
                  textValue: language.name,
                };
              }),
            );
          }

          return values.map((value) => ({
            booleanValue: null,
            cityId: null,
            languageId: null,
            numberValue: null,
            questionId: question.id,
            textValue: value.label,
          }));
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

          return [
            {
              booleanValue: answer === "yes",
              cityId: null,
              languageId: null,
              numberValue: null,
              questionId: question.id,
              textValue: null,
            },
          ];
        }

        if (question.type === SurveyQuestionType.NUMBER) {
          const numberValue = Number(answer);

          if (!Number.isFinite(numberValue)) {
            throw new Error(
              `An invalid number was submitted for "${question.prompt}".`,
            );
          }

          return [
            {
              booleanValue: null,
              cityId: null,
              languageId: null,
              numberValue,
              questionId: question.id,
              textValue: null,
            },
          ];
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
            booleanValue: null,
            cityId: null,
            languageId: null,
            numberValue: null,
            questionId: question.id,
            textValue: answer,
          },
        ];
      }),
    );

    answersToCreate = answerGroups.flat();
  } catch (error) {
    console.log("failed to batch responses: " + error);
    if (error instanceof Error) {
      return createSurveyActionError(error.message);
    } else {
      return createSurveyActionError("Something went wrong");
    }
  }

  if (answersToCreate.length > 0) {
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

      await tx.surveyAnswer.createMany({
        data: answersToCreate.map((answer) => ({
          booleanValue: answer.booleanValue,
          cityId: answer.cityId ?? null,
          languageId: answer.languageId ?? null,
          numberValue: answer.numberValue,
          questionId: answer.questionId,
          submissionId: submission.id,
          textValue: answer.textValue,
        })),
      });
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/survey");
  redirect("/dashboard");
}
