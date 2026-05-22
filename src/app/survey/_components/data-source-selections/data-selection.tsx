import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import CitySelection from "./city-selection";
import CountrySelection from "./country-selection";

type DataSelectionProps = {
  answer: string;
  questionId: string;
  setSingleAnswer: (questionId: string, value: string) => void;
  source: string;
};

export default function DataSelection({
  answer,
  questionId,
  setSingleAnswer,
  source,
}: DataSelectionProps) {
  switch (source) {
    case SurveyQuestionDataSource.COUNTRY:
      return (
        <CountrySelection
          answer={answer}
          questionId={questionId}
          setSingleAnswer={setSingleAnswer}
        />
      );
    case SurveyQuestionDataSource.CITY:
      return (
        <CitySelection
          answer={answer}
          questionId={questionId}
          setSingleAnswer={setSingleAnswer}
        />
      );
  }

  return <div>No selection available...</div>;
}
