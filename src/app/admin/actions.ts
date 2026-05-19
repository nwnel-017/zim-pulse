"use server";

import { revalidatePath } from "next/cache";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import { requireAdminSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { sanitizeTextInput } from "@/utils/validation/sanitize-input";

const surveyQuestionTypes = new Set(Object.values(SurveyQuestionType));

export async function createSurveyQuestion(formData: FormData) {
  await requireAdminSession();

  const promptValue = formData.get("prompt");
  const typeValue = formData.get("type");

  const prompt = sanitizeTextInput(promptValue, {
    fieldName: "Question prompt",
    maxLength: 500,
  });
  const type = typeof typeValue === "string" ? typeValue : "";

  if (!surveyQuestionTypes.has(type as SurveyQuestionType)) {
    throw new Error("Question type is invalid.");
  }

  await prisma.surveyQuestion.create({
    data: {
      prompt,
      type: type as SurveyQuestionType,
    },
  });

  revalidatePath("/admin");
}

export async function updateSurveyQuestion(formData: FormData) {
  await requireAdminSession();

  const questionIdValue = formData.get("questionId");
  const promptValue = formData.get("prompt");

  const questionId = sanitizeTextInput(questionIdValue, {
    fieldName: "Question ID",
    maxLength: 191,
  });
  const prompt = sanitizeTextInput(promptValue, {
    fieldName: "Question prompt",
    maxLength: 500,
  });

  const result = await prisma.surveyQuestion.updateMany({
    where: {
      id: questionId,
    },
    data: {
      prompt,
    },
  });

  if (!result.count) {
    throw new Error("Survey question not found.");
  }

  revalidatePath("/admin");
}

export async function deleteSurveyQuestion(formData: FormData) {
  await requireAdminSession();

  const questionIdValue = formData.get("questionId");
  const questionId = sanitizeTextInput(questionIdValue, {
    fieldName: "Question ID",
    maxLength: 191,
  });

  const result = await prisma.surveyQuestion.deleteMany({
    where: {
      id: questionId,
    },
  });

  if (!result.count) {
    throw new Error("Survey question not found.");
  }

  revalidatePath("/admin");
}
