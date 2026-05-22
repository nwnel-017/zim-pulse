import { SurveyQuestionDataSource } from "@/generated/prisma/enums";

const disallowedControlCharacters =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const validDataSources: ReadonlySet<SurveyQuestionDataSource> = new Set(
  Object.values(SurveyQuestionDataSource),
);

export function sanitizeTextInput(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return { success: false, error: "Input must be text.", value: "" };
  }

  const sanitizedValue = value
    .normalize("NFKC")
    .replace(disallowedControlCharacters, "")
    .trim();

  if (!sanitizedValue) {
    return { success: false, error: `Invalid characters.`, value: "" };
  }

  if (sanitizedValue.length > maxLength) {
    return {
      success: false,
      error: `Input must be less than ${maxLength} characters.`,
      value: "",
    };
  }

  return { success: true, error: null, value: sanitizedValue };
}

export function sanitizeDataSource(value: unknown) {
  if (typeof value !== "string") {
    return { success: false, error: "Input must be text.", value: null };
  }

  const sanitizedValue = value
    .normalize("NFKC")
    .replace(disallowedControlCharacters, "")
    .trim();

  if (!sanitizedValue) {
    return {
      success: false,
      error: "Select a valid data source.",
      value: null,
    };
  }

  if (!validDataSources.has(sanitizedValue as SurveyQuestionDataSource)) {
    return {
      success: false,
      error: "Select a valid data source.",
      value: null,
    };
  }

  const dataSource = sanitizedValue as SurveyQuestionDataSource;

  return {
    success: true,
    error: null,
    value: dataSource,
  };
}
