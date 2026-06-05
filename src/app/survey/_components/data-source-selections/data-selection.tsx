import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import type { AddSurveyResponse, SearchSelectAnswer } from "@/types/survey";
import SearchSelection from "./search-selection";

type DataSelectionProps = {
  answer: SearchSelectAnswer;
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
        <SearchSelection
          answer={answer}
          addResponse={addResponse}
          emptyStateText="No countries matched your search."
          loadingText="Searching countries..."
          placeholder="Start typing a country name"
          questionId={questionId}
          searchLabel="Search for a country"
          showMeta={false}
          source={source}
        />
      );
    case SurveyQuestionDataSource.CITY:
      return (
        <SearchSelection
          answer={answer}
          addResponse={addResponse}
          emptyStateText="No cities matched your search."
          loadingText="Searching cities..."
          placeholder="Start typing a city name"
          questionId={questionId}
          searchLabel="Search for a city"
          showMeta
          source={source}
        />
      );
    case SurveyQuestionDataSource.LANGUAGE:
      return (
        <SearchSelection
          answer={answer}
          addResponse={addResponse}
          emptyStateText="No languages matched your search."
          loadingText="Searching languages..."
          placeholder="Start typing a language name"
          questionId={questionId}
          searchLabel="Search for a language"
          showMeta
          source={source}
        />
      );
  }

  return <div>No selection available...</div>;
}
