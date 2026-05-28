import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import type { AddSurveyResponse } from "@/types/survey";
import CitySelection from "./city-selection";
import CountrySelection from "./country-selection";

type DataSelectionProps = {
  answer: string;
  addResponse: AddSurveyResponse;
  questionId: string;
  source: SurveyQuestionDataSource;
};

export default function DataSelection({
  answer,
  addResponse,
  questionId,
  source,
}: DataSelectionProps) {
  switch (source) {
    case SurveyQuestionDataSource.COUNTRY:
      return (
        <CountrySelection
          answer={answer}
          addResponse={addResponse}
          questionId={questionId}
        />
      );
    case SurveyQuestionDataSource.CITY:
      return (
        <CitySelection
          answer={answer}
          addResponse={addResponse}
          questionId={questionId}
        />
      );
  }

  return <div>No selection available...</div>;
}
