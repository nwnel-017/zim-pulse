"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SurveyActionState } from "@/app/survey/action-state";
import {
  surveyCheckboxAnswersSchema,
  surveyTextAnswerSchema,
} from "@/app/survey/schemas";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import { requireSurveySession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { getIncompleteSurveyQuestions } from "@/lib/survey/survey";

const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);
const booleanQuestionValues = new Set(["yes", "no"]);

function createSurveyActionError(error: string): SurveyActionState {
  return { success: false, error };
}

export async function submitSurveyResponses(
  _previousState: SurveyActionState,
  formData: FormData,
): Promise<SurveyActionState> {
  const session = await requireSurveySession();
  const questions = await getIncompleteSurveyQuestions(session.user.id);

  if (!questions.length) {
    redirect("/dashboard");
  }

  let responsesToCreate: Array<{
    answer: string;
    questionId: string;
    userId: string;
  }>;
  try {
    responsesToCreate = questions.flatMap((question) => {
      const fieldName = `question-${question.id}`;

      if (question.type === SurveyQuestionType.CHECKBOX) {
        const validationResult = surveyCheckboxAnswersSchema.safeParse(
          formData.getAll(fieldName),
        );

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

        return values.map((answer) => ({
          answer,
          questionId: question.id,
          userId: session.user.id,
        }));
      }

      const validationResult = surveyTextAnswerSchema.safeParse(
        formData.get(fieldName),
      );

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
    });
  } catch (error) {
    console.log("failed to batch responses: " + error);
    if (error instanceof Error) {
      return createSurveyActionError(error.message);
    } else {
      return createSurveyActionError("Something went wrong");
    }
  }

  await prisma.surveyResponse.createMany({
    data: responsesToCreate,
  });

  revalidatePath("/dashboard");
  revalidatePath("/survey");
  redirect("/dashboard");
}
