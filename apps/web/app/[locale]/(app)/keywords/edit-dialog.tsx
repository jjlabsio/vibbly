"use client";

import { Keyword } from "@/generated/prisma";
import { ActionState, editKeyword } from "@/lib/actions/keywords";
import { Button } from "@vibbly/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@vibbly/ui/components/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@vibbly/ui/components/field";
import { Input } from "@vibbly/ui/components/input";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  keyword: Keyword | null;
}

export function EditKeywordDialog({ open, setOpen, keyword }: Props) {
  const t = useTranslations("Keywords.EditDialog");

  const initState: ActionState = { success: false, message: null, errors: {} };
  const editKeywordWithId = editKeyword.bind(null, keyword?.id ?? "");
  const [state, formAction] = useActionState(editKeywordWithId, initState);

  useEffect(() => {
    if (state.success) {
      toast.success(t("success"));
      setOpen(false);
    }

    if (!state.success && state.message) {
      toast.error(t("error"));
    }
  }, [setOpen, state, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <FieldSet>
            <Field>
              <FieldLabel htmlFor="keyword">{t("keywordLabel")}</FieldLabel>
              <Input
                id="keyword"
                name="keyword"
                defaultValue={keyword?.text ?? ""}
                aria-invalid={Boolean(state.errors?.text?.length)}
              />
              {state.errors?.text &&
                state.errors.text.map((error) => (
                  <FieldError key={error}>{t(error)}</FieldError>
                ))}
            </Field>

            <Field>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t("cancel")}</Button>
                </DialogClose>
                <Button type="submit">{t("submit")}</Button>
              </DialogFooter>
            </Field>
          </FieldSet>
        </form>
      </DialogContent>
    </Dialog>
  );
}
