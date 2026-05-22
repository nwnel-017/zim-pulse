"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/admin/action-state";
import {
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import { requireAdminSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import {
  sanitizeDataSource,
  sanitizeTextInput,
} from "@/utils/validation/sanitize-input";

const surveyQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set(
  Object.values(SurveyQuestionType),
);
const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);

function createQuestionError(message: string) {
  return { success: false, error: message, resetKey: "initial" };
}

function createQuestionSuccess(): ActionState {
  return {
    success: true,
    error: null,
  };
}

function createOptionValue(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createSurveyQuestion(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();

  const promptValue = formData.get("prompt");
  const typeValue = formData.get("type");
  const dataSourceValue = formData.get("datasource");

  if (!promptValue || typeof promptValue !== "string") {
    return createQuestionError("Question prompt is required.");
  }
  const maxLength = 500;

  const sanitizedInput = sanitizeTextInput(promptValue);

  if (!sanitizedInput.success) {
    return createQuestionError(
      sanitizedInput.error || "Invalid question prompt.",
    );
  }

  if (sanitizedInput.value.length > maxLength) {
    return createQuestionError("Input must be less than 500 characters");
  }

  const prompt = sanitizedInput.value;
  const type = typeof typeValue === "string" ? typeValue : "";

  if (!surveyQuestionTypes.has(type as SurveyQuestionType)) {
    return createQuestionError("Invalid question type.");
  }

  const questionType = type as SurveyQuestionType;
  const dataSourceResult = sanitizeDataSource(dataSourceValue);
  const optionLabels = formData
    .getAll("optionLabel")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (questionType === SurveyQuestionType.SEARCH_SELECT) {
    if (!dataSourceResult.success) {
      return createQuestionError(
        dataSourceResult.error || "Select a valid data source.",
      );
    }
  }

  if (selectableQuestionTypes.has(questionType) && !optionLabels.length) {
    return createQuestionError(
      "Add at least one selection choice for this question type.",
    );
  }
  const maxOptionLength = 120;
  const comboOptions: Array<{
    label: string;
    sortOrder: number;
  }> = [];

  for (const [index, optionLabel] of optionLabels.entries()) {
    const sanitizedLabel = sanitizeTextInput(optionLabel);
    if (!sanitizedLabel.success || !sanitizedLabel.value) {
      return createQuestionError(sanitizedLabel.error || "Invalid input.");
    }

    if (sanitizedLabel.value.length > maxOptionLength) {
      return createQuestionError(
        "Selection option must be under 120 characters",
      );
    }
    const label = sanitizedLabel.value;
    const baseValue = createOptionValue(label);

    if (!baseValue) {
      return createQuestionError(
        `Selection choice ${index + 1} must include letters or numbers.`,
      );
    }

    comboOptions.push({
      label,
      sortOrder: index,
    });
  }

  try {
    await prisma.surveyQuestion.create({
      data: {
        comboOptions: comboOptions.length
          ? {
              create: comboOptions,
            }
          : undefined,
        datasource:
          questionType === SurveyQuestionType.SEARCH_SELECT
            ? dataSourceResult.value
            : null,
        prompt,
        type: questionType,
      },
    });
    revalidatePath("/admin");
    return createQuestionSuccess();
  } catch (error) {
    console.log(error);
    return createQuestionError("Something went wrong");
  }
}

export async function updateSurveyQuestion(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();

  const questionIdValue = formData.get("questionId");
  const promptValue = formData.get("prompt");

  const maxQuestionLength = 191;
  const maxPromptLength = 500;
  const questionIdResult = sanitizeTextInput(questionIdValue);
  const promptResult = sanitizeTextInput(promptValue);

  if (
    !questionIdResult.success ||
    !questionIdResult.value ||
    !promptResult.success ||
    !promptResult.value
  ) {
    return { success: false, error: "Invalid input." };
  }

  if (
    questionIdResult.value.length > maxQuestionLength ||
    promptResult.value.length > maxPromptLength
  ) {
    return { success: false, error: "Input is too long" };
  }

  const questionId = questionIdResult.value;
  const prompt = promptResult.value;

  const result = await prisma.surveyQuestion.updateMany({
    where: {
      id: questionId,
    },
    data: {
      prompt,
    },
  });

  if (!result.count) {
    return {
      success: false,
      error: "Survey question not found.",
    };
  }

  revalidatePath("/admin");
  return createQuestionSuccess();
}

export async function deleteSurveyQuestion(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();

  const questionIdValue = formData.get("questionId");
  const maxLength = 191;
  const questionIdResult = sanitizeTextInput(questionIdValue);

  if (!questionIdResult.success || !questionIdResult.value) {
    return {
      success: false,
      error: "Invalid question ID.",
    };
  }

  if (questionIdResult.value.length > maxLength) {
    return { success: false, error: "Invalid input" };
  }

  const questionId = questionIdResult.value;
  const result = await prisma.surveyQuestion.deleteMany({
    where: {
      id: questionId,
    },
  });

  if (!result.count) {
    return {
      success: false,
      error: "Survey question not found.",
    };
  }

  revalidatePath("/admin");
  return createQuestionSuccess();
}
