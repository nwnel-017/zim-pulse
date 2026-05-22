"use client";

import { useActionState } from "react";
import { initialActionState } from "@/app/admin/action-state";
import { deleteSurveyQuestion } from "@/app/admin/actions";

type DeleteSurveyQuestionFormProps = {
  questionId: string;
};

export function DeleteSurveyQuestionForm({
  questionId,
}: DeleteSurveyQuestionFormProps) {
  const [state, formAction, isPending] = useActionState(
    deleteSurveyQuestion,
    initialActionState,
  );

  return (
    <form action={formAction}>
      <input name="questionId" type="hidden" value={questionId} />
      <button
        className="auth-button ghost-button admin-inline-button"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Deleting..." : "Delete question"}
      </button>
      {state.error ? <p className="auth-error">{state.error}</p> : null}
    </form>
  );
}
