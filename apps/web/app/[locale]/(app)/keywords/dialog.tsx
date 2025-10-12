"use client";

import { ActionResult, createKeyword } from "@/lib/actions/keywords";
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
import { Field, FieldLabel, FieldSet } from "@vibbly/ui/components/field";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CreateKeywordDialog({ open, setOpen }: Props) {
  const t = useTranslations("Keywords.Dialog");
  const [state, formAction] = useActionState<ActionResult, FormData>(
    createKeyword,
    {
      success: false,
    }
  );

  useEffect(() => {
    if (state.success) {
      toast.success(t("success"));
      setOpen(false);
    }

    if (state.error) {
      toast.error(state.error);
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
              <Input id="keyword" name="keyword" />
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
