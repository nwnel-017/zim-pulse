type SanitizeInputOptions = {
  allowEmpty?: boolean;
  fieldName?: string;
  maxLength?: number;
};

const disallowedControlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeTextInput(
  value: unknown,
  options: SanitizeInputOptions = {},
) {
  const {
    allowEmpty = false,
    fieldName = "Value",
    maxLength,
  } = options;

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be text.`);
  }

  const sanitizedValue = value
    .normalize("NFKC")
    .replace(disallowedControlCharacters, "")
    .trim();

  if (!allowEmpty && !sanitizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  if (typeof maxLength === "number" && sanitizedValue.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }

  return sanitizedValue;
}
