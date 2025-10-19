"use client";

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
  FieldGroup,
  FieldLabel,
} from "@vibbly/ui/components/field";
import { Form } from "@vibbly/ui/components/form";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { CreateKeywordSchema } from "@/schema/keyword";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function CreateKeywordDialog({ open, setOpen }: Props) {
  const t = useTranslations("Keywords.CreateDialog");
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof CreateKeywordSchema>>({
    resolver: zodResolver(CreateKeywordSchema),
    defaultValues: {
      text: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof CreateKeywordSchema>) => {
    try {
      await api.post("/api/keywords", values);

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="create-keyword-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            <FieldGroup>
              <Controller
                name="text"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-dialog-text">
                      keyword
                    </FieldLabel>
                    <Input
                      {...field}
                      id="create-dialog-text"
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
            form="create-keyword-form"
            disabled={form.formState.isSubmitting}
          >
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
