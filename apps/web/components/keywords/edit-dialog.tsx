"use client";

import { Keyword } from "@/generated/prisma";
import { api } from "@/lib/api";
import { EditKeywordSchema } from "@/schema/keyword";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
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
  FieldGroup,
  FieldLabel,
} from "@vibbly/ui/components/field";
import { Form } from "@vibbly/ui/components/form";
import { Input } from "@vibbly/ui/components/input";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

export interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  keyword: Keyword | null;
}

export function EditKeywordDialog({ open, setOpen, keyword }: Props) {
  if (!keyword) return null;

  const t = useTranslations("Keywords.EditDialog");
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof EditKeywordSchema>>({
    resolver: zodResolver(EditKeywordSchema),
    defaultValues: {
      text: keyword.text,
      id: keyword.id,
    },
  });

  const onSubmit = async (values: z.infer<typeof EditKeywordSchema>) => {
    try {
      await api.put("/api/keywords", values);

      setOpen(false);
      toast.success(t("success"));

      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    }
  };

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="edit-keyword-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <FieldGroup>
              <Controller
                name="text"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-dialog-text">
                      {t("keywordLabel")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-dialog-text"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </Form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-keyword-form"
            disabled={form.formState.isSubmitting}
          >
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
