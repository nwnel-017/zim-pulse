import { SurveyQuestionDataSource } from "@/generated/prisma/enums";
import { dataSourceTypeLabels } from "@/lib/survey/question-types";

export default function DataSourceOptions({
  selectedDataSource,
  onDataSourceChange,
  required,
}: {
  onDataSourceChange: (value: SurveyQuestionDataSource) => void;
  required: boolean;
  selectedDataSource: SurveyQuestionDataSource;
}) {
  return (
    <label className="auth-field">
      <span>Data source</span>
      <select
        className="auth-select"
        name="datasource"
        onChange={(event) =>
          onDataSourceChange(event.target.value as SurveyQuestionDataSource)
        }
        required={required}
        value={selectedDataSource}
      >
        <option value="">Choose a data source</option>
        {Object.values(SurveyQuestionDataSource).map((source) => (
          <option key={source} value={source}>
            {dataSourceTypeLabels[source]}
          </option>
        ))}
      </select>
    </label>
  );
}
