"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initialActionState } from "@/app/admin/action-state";
import {
  deleteSurveyQuestionOption,
  updateSurveyQuestion,
  updateSurveyQuestionOption,
} from "@/app/admin/actions";
import { SurveyQuestionType } from "@/generated/prisma/enums";
import type { SurveyQuestionOption } from "@/types/survey";

type SurveyQuestionEditorProps = {
  comboOptions: SurveyQuestionOption[];
  prompt: string;
  questionId: string;
  type: SurveyQuestionType;
};

const selectableQuestionTypes: ReadonlySet<SurveyQuestionType> = new Set([
  SurveyQuestionType.DROPDOWN,
  SurveyQuestionType.RADIO,
  SurveyQuestionType.CHECKBOX,
]);

type SurveyQuestionOptionEditorRowProps = {
  option: SurveyQuestionOption;
  questionId: string;
};

function SurveyQuestionOptionEditorRow({
  option,
  questionId,
}: SurveyQuestionOptionEditorRowProps) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateSurveyQuestionOption,
    initialActionState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteSurveyQuestionOption,
    initialActionState,
  );

  return (
    <li className="admin-option-row">
      <form action={updateAction} className="auth-form admin-inline-form">
        <input name="questionId" type="hidden" value={questionId} />
        <input name="optionId" type="hidden" value={option.id} />

        <label className="auth-field">
          <span>Choice label</span>
          <input defaultValue={option.label} name="label" required type="text" />
        </label>

        <div className="admin-inline-actions">
          <button className="auth-button" disabled={isUpdating} type="submit">
            {isUpdating ? "Saving..." : "Save"}
          </button>
        </div>

        {updateState.error ? <p className="auth-error">{updateState.error}</p> : null}
      </form>

      <form action={deleteAction} className="admin-inline-form">
        <input name="questionId" type="hidden" value={questionId} />
        <input name="optionId" type="hidden" value={option.id} />

        <div className="admin-inline-actions">
          <button
            className="auth-button ghost-button"
            disabled={isDeleting}
            type="submit"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>

        {deleteState.error ? <p className="auth-error">{deleteState.error}</p> : null}
      </form>
    </li>
  );
}

export function SurveyQuestionEditor({
  comboOptions,
  prompt,
  questionId,
  type,
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

  const showsChoices = selectableQuestionTypes.has(type);

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

      {showsChoices ? (
        <section className="admin-inline-form">
          <p className="eyebrow">Selection Choices</p>
          {comboOptions.length ? (
            <ul className="admin-option-list">
              {comboOptions.map((option) => (
                <SurveyQuestionOptionEditorRow
                  key={option.id}
                  option={option}
                  questionId={questionId}
                />
              ))}
            </ul>
          ) : (
            <p className="auth-error">No choices added yet.</p>
          )}
        </section>
      ) : null}
    </details>
  );
}
