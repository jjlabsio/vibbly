import { Keyword } from "@/generated/prisma";
import { deleteKeyword } from "@/lib/actions/keywords";
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
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  keyword: Keyword | null;
}

export function DeleteKeywordDialog({ open, setOpen, keyword }: Props) {
  const t = useTranslations("Keywords.DeleteDialog");
  const queryClient = useQueryClient();

  const deleteKeywordWithId = deleteKeyword.bind(null, keyword?.id || "");

  const handleAction = async () => {
    await deleteKeywordWithId();

    setOpen(false);
    toast.success(t("success"));

    queryClient.invalidateQueries({ queryKey: ["keywords"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("fallbackDescription")}</DialogDescription>
        </DialogHeader>
        <form action={handleAction}>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("cancel")}</Button>
            </DialogClose>
            <Button type="submit">{t("submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
