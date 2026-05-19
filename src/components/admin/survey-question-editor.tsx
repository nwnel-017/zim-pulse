"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSurveyQuestion } from "@/app/admin/actions";

type SurveyQuestionEditorProps = {
  prompt: string;
  questionId: string;
};

export function SurveyQuestionEditor({
  prompt,
  questionId,
}: SurveyQuestionEditorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      await updateSurveyQuestion(formData);
      setIsOpen(false);
      router.refresh();
    } catch (submissionError) {
      if (
        typeof submissionError === "object" &&
        submissionError !== null &&
        "message" in submissionError &&
        typeof submissionError.message === "string"
      ) {
        setError(submissionError.message);
      } else {
        setError("Unable to save changes.");
      }
    } finally {
      setIsPending(false);
    }
  }

  function handleCancel() {
    setError(null);
    setIsOpen(false);
  }

  return (
    <details
      className="admin-question-editor"
      onToggle={(event) => {
        setIsOpen(event.currentTarget.open);
      }}
      open={isOpen}
    >
      <summary className="auth-button ghost-button admin-inline-button">
        Edit question
      </summary>

      <form className="auth-form admin-inline-form" onSubmit={handleSubmit}>
        <input name="questionId" type="hidden" value={questionId} />

        <label className="auth-field">
          <span>Question prompt</span>
          <input defaultValue={prompt} name="prompt" required type="text" />
        </label>

        <div className="admin-inline-actions">
          <button className="auth-button" disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Save changes"}
          </button>
          <button
            className="auth-button ghost-button"
            disabled={isPending}
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>

      {error ? <p className="auth-error">{error}</p> : null}
    </details>
  );
}
