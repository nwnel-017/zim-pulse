import { z } from "zod";
import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import {
  normalizeTextValue,
  normalizedText,
} from "@/utils/validation/zod-helpers";

const surveyQuestionDataSourceValues = Object.values(
  SurveyQuestionDataSource,
) as [SurveyQuestionDataSource, ...SurveyQuestionDataSource[]];

export const surveySearchSchema = z.object({
  countryId: normalizedText({
    invalidTypeError: "Invalid country.",
    max: 100,
  }).optional(),
  q: normalizedText({
    emptyError: "Enter at least 2 characters to search.",
    invalidTypeError: "Enter at least 2 characters to search.",
    max: 100,
    min: 2,
    tooShortError: "Enter at least 2 characters to search.",
  }),
  source: z.preprocess(
    (value) => (typeof value === "string" ? normalizeTextValue(value) : value),
    z.enum(surveyQuestionDataSourceValues, {
      error: "Invalid data source.",
    }),
  ),
});
