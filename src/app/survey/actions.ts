"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SurveyActionState } from "@/app/survey/action-state";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import { requireSurveySession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { getIncompleteSurveyQuestions } from "@/lib/survey/survey";
import { sanitizeTextInput } from "@/utils/validation/sanitize-input";

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
        const values = formData
          .getAll(fieldName)
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean);

        if (!values.length) {
          throw new Error(`A response is required for "${question.prompt}".`);
        }

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

      let maxLength = 5000;
      const rawValue = formData.get(fieldName);
      const answerResult = sanitizeTextInput(rawValue);

      if (!answerResult.success || !answerResult.value) {
        throw new Error("Invalid answer.");
      }

      if (answerResult.value.length > maxLength) {
        throw new Error("Answer is too long.");
      }

      const answer = answerResult.value;

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
