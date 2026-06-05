import { SurveyQuestionType, SurveyResponseMode } from "@/generated/prisma/enums";

export const responseModes = {
  MULTIPLE: SurveyResponseMode.MULTI_SELECT,
  SINGLE: SurveyResponseMode.SINGLE_SELECT,
} as const;

export type ResponseModeValue =
  (typeof responseModes)[keyof typeof responseModes];

type QuestionWithOptionalResponseMode = {
  responseMode?: ResponseModeValue | null;
  type: SurveyQuestionType;
};

export function getResponseMode(
  question: QuestionWithOptionalResponseMode,
): ResponseModeValue {
  if (question.responseMode) {
    return question.responseMode;
  }

  return question.type === SurveyQuestionType.CHECKBOX
    ? responseModes.MULTIPLE
    : responseModes.SINGLE;
}

export function getResponseModeForQuestionType(
  questionType: SurveyQuestionType,
  allowMultipleAnswers = false,
): ResponseModeValue {
  return ((questionType === SurveyQuestionType.CHECKBOX
      || questionType === SurveyQuestionType.SEARCH_SELECT) && allowMultipleAnswers)
    ? responseModes.MULTIPLE
    : responseModes.SINGLE;
}
