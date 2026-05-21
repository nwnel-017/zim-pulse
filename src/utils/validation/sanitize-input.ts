const disallowedControlCharacters =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeTextInput(value: unknown) {
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

  return { success: true, error: null, value: sanitizedValue };
}
