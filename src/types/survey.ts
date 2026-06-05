import {
  SurveyQuestionDataSource,
  SurveyQuestionType,
  SurveyResponseMode,
} from "@/generated/prisma/enums";

export type SurveyQuestionOption = {
  id: string;
  label: string;
};

export type FrontendSurveyQuestion = {
  comboOptions: SurveyQuestionOption[];
  datasource: SurveyQuestionDataSource | null; // COUNTRY | CITY | null
  id: string;
  prompt: string;
  required: boolean;
  responseMode: SurveyResponseMode;
  type: SurveyQuestionType;
};

export type SurveyAnswerValue =
  | string
  | string[]
  | SearchSelectAnswer
  | SearchSelectAnswer[];

export type SearchSelectAnswer = {
  label: string;
  selectedId: string | null;
};

export type SurveyAnswers = Record<string, SurveyAnswerValue>;

export type EditableSurveyResponseQuestion = FrontendSurveyQuestion & {
  currentAnswer: SurveyAnswerValue;
};

export type GlobeCityPoint = {
  cityId: string;
  cityName: string;
  countryName: string;
  lat: number;
  lng: number;
  userCount: number;
};

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
