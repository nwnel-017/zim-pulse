"use server";

import { revalidatePath } from "next/cache";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import { requireAdminSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import { sanitizeTextInput } from "@/utils/validation/sanitize-input";

const surveyQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set(
  Object.values(SurveyQuestionType),
);
const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);

function createOptionValue(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  const questionType = type as SurveyQuestionType;
  const optionLabels = formData
    .getAll("optionLabel")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (selectableQuestionTypes.has(questionType) && !optionLabels.length) {
    throw new Error("Add at least one selection choice for this question type.");
  }

  const seenOptionValues = new Set<string>();
  const comboOptions = optionLabels.map((optionLabel, index) => {
    const label = sanitizeTextInput(optionLabel, {
      fieldName: `Selection choice ${index + 1}`,
      maxLength: 120,
    });
    const baseValue = createOptionValue(label);

    if (!baseValue) {
      throw new Error(`Selection choice ${index + 1} must include letters or numbers.`);
    }

    let value = baseValue;
    let suffix = 2;

    while (seenOptionValues.has(value)) {
      value = `${baseValue}-${suffix}`;
      suffix += 1;
    }

    seenOptionValues.add(value);

    return {
      label,
      sortOrder: index,
      value,
    };
  });

  await prisma.surveyQuestion.create({
    data: {
      comboOptions: comboOptions.length
        ? {
            create: comboOptions,
          }
        : undefined,
      prompt,
      type: questionType,
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
