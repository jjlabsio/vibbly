import { Button } from "@workspace/ui/components/button";
import * as Icons from "@workspace/ui/components/icons";

export function LocaleChange() {
  return (
    <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
      <Icons.Languages />
    </Button>
  );
}
