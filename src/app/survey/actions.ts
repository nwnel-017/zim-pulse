"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import { requireSurveySession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { getIncompleteSurveyQuestions } from "@/lib/survey/survey";
import { sanitizeTextInput } from "@/utils/validation/sanitize-input";

const selectableQuestionTypes = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);

export async function submitSurveyResponses(formData: FormData) {
  const session = await requireSurveySession();
  const questions = await getIncompleteSurveyQuestions(session.user.id);

  if (!questions.length) {
    redirect("/dashboard");
  }

  const responsesToCreate = questions.flatMap((question) => {
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

      const allowedValues = new Set(question.comboOptions.map((option) => option.value));

      for (const value of values) {
        if (!allowedValues.has(value)) {
          throw new Error(`An invalid option was submitted for "${question.prompt}".`);
        }
      }

      return values.map((answer) => ({
        answer,
        questionId: question.id,
        userId: session.user.id,
      }));
    }

    const rawValue = formData.get(fieldName);
    const answer = sanitizeTextInput(rawValue, {
      fieldName: `Response for "${question.prompt}"`,
      maxLength: 5000,
    });

    if (selectableQuestionTypes.has(question.type)) {
      const allowedValues = new Set(question.comboOptions.map((option) => option.value));

      if (!allowedValues.has(answer)) {
        throw new Error(`An invalid option was submitted for "${question.prompt}".`);
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

  await prisma.surveyResponse.createMany({
    data: responsesToCreate,
  });

  revalidatePath("/dashboard");
  revalidatePath("/survey");
  redirect("/dashboard");
}
