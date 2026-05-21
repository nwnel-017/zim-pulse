import { SurveyQuestionType } from "@/generated/prisma/enums";

export const surveyQuestionTypeLabels: Record<SurveyQuestionType, string> = {
  TEXT: "Single line response",
  TEXTAREA: "Short answer response",
  NUMBER: "Number",
  DROPDOWN: "Dropdown",
  RADIO: "Single select",
  CHECKBOX: "Checkbox",
  BOOLEAN: "Yes / No",
  DATE: "Date",
  EMAIL: "Email",
  SEARCH_SELECT: "Lookup search",
};
