import { deleteKeywordList } from "@/lib/actions/keywords";
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
  keywordIds: string[];
  onSuccess?: () => void;
}

export function DeleteKeywordListDialog({
  open,
  setOpen,
  keywordIds = [],
  onSuccess,
}: Props) {
  const t = useTranslations("Keywords.DeleteListDialog");
  const selectedCount = keywordIds.length;

  const deleteKeywordListWithId = deleteKeywordList.bind(null, keywordIds);

  const handleAction = async () => {
    await deleteKeywordListWithId();

    setOpen(false);
    toast.success(t("success", { count: selectedCount }));

    onSuccess && onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { count: selectedCount })}
          </DialogDescription>
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
