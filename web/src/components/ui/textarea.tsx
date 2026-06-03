import * as React from "react";
import { cn } from "@/lib/Utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-input bg-input-background placeholder:text-muted-foreground flex min-h-20 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
