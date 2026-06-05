"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/app/admin/action-state";
import {
  createSurveyQuestionSchema,
  deleteSurveyQuestionOptionSchema,
  deleteSurveyQuestionSchema,
  updateSurveyQuestionOptionSchema,
  updateSurveyQuestionSchema,
} from "@/app/admin/schemas";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import { requireAdminSession } from "@/lib/auth/middleware";
import { prisma } from "@/lib/prisma/prisma";
import {
  getResponseModeForQuestionType,
  questionTypeSupportsResponseMode,
} from "@/lib/survey/response-mode";
import { getFirstZodIssueMessage } from "@/utils/validation/zod-helpers";

function createQuestionError(message: string) {
  return { success: false, error: message, resetKey: "initial" };
}

function createQuestionSuccess(): ActionState {
  return {
    success: true,
    error: null,
  };
}

export async function createSurveyQuestion(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();

  const validationResult = createSurveyQuestionSchema.safeParse({
    allowMultipleAnswers: formData.get("allowMultipleAnswers"),
    datasource: formData.get("datasource"),
    optionLabels: formData.getAll("optionLabel"),
    prompt: formData.get("prompt"),
    sortOrder: formData.get("sortOrder"),
    type: formData.get("type"),
  });

  if (!validationResult.success) {
    return createQuestionError(getFirstZodIssueMessage(validationResult.error));
  }

  const {
    allowMultipleAnswers,
    datasource,
    optionLabels,
    prompt,
    sortOrder,
    type,
  } = validationResult.data;
  const comboOptions: Array<{
    label: string;
    sortOrder: number;
  }> = [];

  for (const [index, label] of optionLabels.entries()) {
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
          type === SurveyQuestionType.SEARCH_SELECT ? datasource : null,
        prompt,
        responseMode: questionTypeSupportsResponseMode(type)
          ? getResponseModeForQuestionType(type, allowMultipleAnswers)
          : null,
        sortOrder,
        type,
      },
    } as never);
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

  const validationResult = updateSurveyQuestionSchema.safeParse({
    allowMultipleAnswers: formData.get("allowMultipleAnswers"),
    prompt: formData.get("prompt"),
    questionId: formData.get("questionId"),
    required: formData.get("required") === "true",
    sortOrder: formData.get("sortOrder"),
    type: formData.get("type"),
  });

  if (!validationResult.success) {
    return { success: false, error: "Invalid input." };
  }

  const {
    allowMultipleAnswers,
    prompt,
    questionId,
    required,
    sortOrder,
    type,
  } = validationResult.data;

  const result = await prisma.surveyQuestion.updateMany({
    where: {
      id: questionId,
    },
    data: {
      prompt,
      required,
      responseMode: questionTypeSupportsResponseMode(type)
        ? getResponseModeForQuestionType(type, allowMultipleAnswers)
        : null,
      sortOrder,
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

  const validationResult = deleteSurveyQuestionSchema.safeParse({
    questionId: formData.get("questionId"),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid question ID.",
    };
  }

  const { questionId } = validationResult.data;
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

export async function updateSurveyQuestionOption(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();

  const validationResult = updateSurveyQuestionOptionSchema.safeParse({
    label: formData.get("label"),
    optionId: formData.get("optionId"),
    questionId: formData.get("questionId"),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: getFirstZodIssueMessage(validationResult.error),
    };
  }

  const { label, optionId, questionId } = validationResult.data;

  const result = await prisma.surveyQuestionComboOption.updateMany({
    data: {
      label,
    },
    where: {
      id: optionId,
      questionId,
    },
  });

  if (!result.count) {
    return {
      success: false,
      error: "Survey question option not found.",
    };
  }

  revalidatePath("/admin");
  return createQuestionSuccess();
}

export async function deleteSurveyQuestionOption(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminSession();

  const validationResult = deleteSurveyQuestionOptionSchema.safeParse({
    optionId: formData.get("optionId"),
    questionId: formData.get("questionId"),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid option.",
    };
  }

  const { optionId, questionId } = validationResult.data;
  const result = await prisma.surveyQuestionComboOption.deleteMany({
    where: {
      id: optionId,
      questionId,
    },
  });

  if (!result.count) {
    return {
      success: false,
      error: "Survey question option not found.",
    };
  }

  revalidatePath("/admin");
  return createQuestionSuccess();
}
