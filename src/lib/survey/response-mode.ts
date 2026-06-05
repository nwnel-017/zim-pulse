import { SurveyQuestionType, SurveyResponseMode } from "@/generated/prisma/enums";

export const responseModes = {
  MULTIPLE: SurveyResponseMode.MULTI_SELECT,
  SINGLE: SurveyResponseMode.SINGLE_SELECT,
} as const;

export type ResponseModeValue =
  (typeof responseModes)[keyof typeof responseModes];

const questionTypesWithResponseMode: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
  SurveyQuestionType.SEARCH_SELECT,
]);

type QuestionWithOptionalResponseMode = {
  responseMode?: ResponseModeValue | null;
  type: SurveyQuestionType;
};

export function questionTypeSupportsResponseMode(questionType: SurveyQuestionType) {
  return questionTypesWithResponseMode.has(questionType);
}

export function getResponseMode(
  question: QuestionWithOptionalResponseMode,
): ResponseModeValue | null {
  if (!questionTypeSupportsResponseMode(question.type)) {
    return null;
  }

  if (question.responseMode) {
    return question.responseMode;
  }

  return getResponseModeForQuestionType(question.type);
}

export function getResponseModeForQuestionType(
  questionType: SurveyQuestionType,
  allowMultipleAnswers = false,
): ResponseModeValue | null {
  if (!questionTypeSupportsResponseMode(questionType)) {
    return null;
  }

  return ((questionType === SurveyQuestionType.CHECKBOX
      || questionType === SurveyQuestionType.SEARCH_SELECT) && allowMultipleAnswers)
    ? responseModes.MULTIPLE
    : responseModes.SINGLE;
}
