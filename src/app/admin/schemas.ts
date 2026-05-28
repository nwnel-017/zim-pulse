import { z } from "zod";
import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";
import {
  normalizeTextValue,
  normalizedText,
} from "@/utils/validation/zod-helpers";

const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);

const surveyQuestionTypeValues = Object.values(SurveyQuestionType) as [
  SurveyQuestionType,
  ...SurveyQuestionType[],
];
const surveyQuestionDataSourceValues = Object.values(
  SurveyQuestionDataSource,
) as [SurveyQuestionDataSource, ...SurveyQuestionDataSource[]];

const optionLabelsSchema = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .map(normalizeTextValue)
          .filter(Boolean)
      : value,
  z.array(
    z
      .string({ error: "Invalid input." })
      .max(120, { error: "Input must be less than 120 characters." }),
  ),
);

export const createSurveyQuestionSchema = z
  .object({
    datasource: z.preprocess(
      (value) => {
        if (typeof value !== "string") {
          return undefined;
        }

        const normalizedValue = normalizeTextValue(value);
        return normalizedValue || undefined;
      },
      z
        .enum(surveyQuestionDataSourceValues, {
          error: "Select a valid data source.",
        })
        .optional(),
    ),
    optionLabels: optionLabelsSchema,
    prompt: normalizedText({
      emptyError: "Question prompt is required.",
      invalidTypeError: "Question prompt is required.",
      max: 500,
    }),
    type: z.enum(surveyQuestionTypeValues, {
      error: "Invalid question type.",
    }),
  })
  .superRefine((value, context) => {
    if (
      value.type === SurveyQuestionType.SEARCH_SELECT &&
      !value.datasource
    ) {
      context.addIssue({
        code: "custom",
        message: "Select a valid data source.",
        path: ["datasource"],
      });
    }

    if (
      selectableQuestionTypes.has(value.type) &&
      value.optionLabels.length === 0
    ) {
      context.addIssue({
        code: "custom",
        message: "Add at least one selection choice for this question type.",
        path: ["optionLabels"],
      });
    }
  });

export const updateSurveyQuestionSchema = z.object({
  prompt: normalizedText({
    max: 500,
  }),
  questionId: normalizedText({
    max: 191,
  }),
  required: z.boolean(),
  sortOrder: z.coerce
    .number({
      error: "Question order must be a valid number.",
    })
    .int({
      error: "Question order must be a whole number.",
    })
    .min(0, {
      error: "Question order cannot be negative.",
    })
    .max(10000, {
      error: "Question order is too large.",
    }),
});

export const deleteSurveyQuestionSchema = z.object({
  questionId: normalizedText({
    max: 191,
  }),
});

export const updateSurveyQuestionOptionSchema = z.object({
  label: normalizedText({
    max: 120,
  }),
  optionId: normalizedText({
    max: 191,
  }),
  questionId: normalizedText({
    max: 191,
  }),
});

export const deleteSurveyQuestionOptionSchema = z.object({
  optionId: normalizedText({
    max: 191,
  }),
  questionId: normalizedText({
    max: 191,
  }),
});
