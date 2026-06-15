import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import type {
  AddSurveyResponse,
  SearchSelectAnswer,
} from "@/types/survey";
import SearchSelection from "./search-selection";

type DataSelectionProps = {
  allowMultiple: boolean;
  answer: SearchSelectAnswer | SearchSelectAnswer[];
  addResponse: AddSurveyResponse;
  questionId: string;
  selectedCountryId?: string | null;
  source: SurveyQuestionDataSource;
};

export default function DataSelection({
  allowMultiple,
  answer,
  addResponse,
  questionId,
  selectedCountryId = null,
  source,
}: DataSelectionProps) {
  switch (source) {
    case SurveyQuestionDataSource.COUNTRY:
      return (
        <SearchSelection
          allowMultiple={allowMultiple}
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
          allowMultiple={allowMultiple}
          answer={answer}
          addResponse={addResponse}
          emptyStateText="No cities matched your search."
          isDisabled={!selectedCountryId}
          loadingText="Searching cities..."
          placeholder="Start typing a city name"
          questionId={questionId}
          searchLabel="Search for a city"
          showMeta
          source={source}
          sourceContextId={selectedCountryId}
        />
      );
    case SurveyQuestionDataSource.LANGUAGE:
      return (
        <SearchSelection
          allowMultiple={allowMultiple}
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
