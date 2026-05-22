import { z } from "zod";
import {
  normalizeTextValue,
  normalizedText,
} from "@/utils/validation/zod-helpers";

export const surveyTextAnswerSchema = normalizedText({
  emptyError: "Invalid answer.",
  invalidTypeError: "Invalid answer.",
  max: 5000,
});

export const surveyCheckboxAnswersSchema = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .map(normalizeTextValue)
          .filter(Boolean)
      : value,
  z
    .array(
      z
        .string({ error: "Invalid answer." })
        .max(5000, { error: "Input must be less than 5000 characters." }),
    )
    .min(1, {
      error: "Invalid answer.",
    }),
);
