import { z } from "zod";

const disallowedControlCharacters =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

type NormalizedTextOptions = {
  emptyError?: string;
  invalidTypeError?: string;
  max: number;
  min?: number;
  tooLongError?: string;
  tooShortError?: string;
};

export function normalizeTextValue(value: string) {
  return value
    .normalize("NFKC")
    .replace(disallowedControlCharacters, "")
    .trim();
}

export function normalizedText(options: NormalizedTextOptions) {
  const min = options.min ?? 1;

  return z.preprocess(
    (value) => (typeof value === "string" ? normalizeTextValue(value) : value),
    z
      .string({
        error: options.invalidTypeError ?? "Input must be text.",
      })
      .min(min, {
        error:
          options.tooShortError ?? options.emptyError ?? "Invalid characters.",
      })
      .max(options.max, {
        error:
          options.tooLongError ??
          `Input must be less than ${options.max} characters.`,
      }),
  );
}

export function getFirstZodIssueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input.";
}
