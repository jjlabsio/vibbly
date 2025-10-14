"use client";

import { ActionState, createKeyword } from "@/lib/actions/keywords";
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
import { Input } from "@vibbly/ui/components/input";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@vibbly/ui/components/field";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function CreateKeywordDialog({ open, setOpen }: Props) {
  const t = useTranslations("Keywords.CreateDialog");

  const initState: ActionState = { success: false, message: null, errors: {} };
  const [state, formAction] = useActionState(createKeyword, initState);

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
      <DialogContent className="sm:max-w-[425px]">
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
