export type SurveyActionState = {
  success: boolean;
  error: string | null;
};

export const initialSurveyActionState: SurveyActionState = {
  success: false,
  error: null,
};
