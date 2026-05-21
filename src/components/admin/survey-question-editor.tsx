"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initialActionState } from "@/app/admin/action-state";
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
  const [state, formAction, isPending] = useActionState(
    updateSurveyQuestion,
    initialActionState,
  );
  const [isOpen, setIsOpen] = useState(false);
 
  useEffect(() => {
    if (!state.success) {
      return;
    }

    setIsOpen(false);
    router.refresh();
  }, [router, state.success]);

  function handleOpenChange(isExpanded: boolean) {
    if (!isExpanded) {
      router.refresh();
    }
  }

  function handleCancel() {
    setIsOpen(false);
  }

  return (
    <details
      className="admin-question-editor"
      onToggle={(event) => {
        const nextIsOpen = event.currentTarget.open;
        setIsOpen(nextIsOpen);
        handleOpenChange(nextIsOpen);
      }}
      open={isOpen}
    >
      <summary className="auth-button ghost-button admin-inline-button">
        Edit question
      </summary>

      <form action={formAction} className="auth-form admin-inline-form">
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

      {state.error ? <p className="auth-error">{state.error}</p> : null}
    </details>
  );
}
