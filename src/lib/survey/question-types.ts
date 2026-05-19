import { SurveyQuestionType } from "@/generated/prisma/enums";

export const surveyQuestionTypeLabels: Record<SurveyQuestionType, string> = {
  TEXT: "Text",
  TEXTAREA: "Textarea",
  NUMBER: "Number",
  DROPDOWN: "Dropdown",
  RADIO: "Radio",
  CHECKBOX: "Checkbox",
  DATE: "Date",
  EMAIL: "Email",
};
