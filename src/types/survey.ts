import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
} from "@/generated/prisma/enums";

export type SurveyQuestionOption = {
  id: string;
  label: string;
};

export type FrontendSurveyQuestion = {
  comboOptions: SurveyQuestionOption[];
  datasource: SurveyQuestionDataSource | null;
  id: string;
  prompt: string;
  required: boolean;
  type: SurveyQuestionType;
};

export type SurveyAnswerValue = string | string[];

export type SurveyAnswers = Record<string, SurveyAnswerValue>;

export type AddSurveyResponse = (
  questionId: string,
  value: SurveyAnswerValue,
) => void;

export type SurveySearchResult = {
  id: string;
  label: string;
  meta: string;
  value: string;
};

export type SurveySearchResponse = {
  message?: string;
  results?: SurveySearchResult[];
};
