import { ToastContainer, ToastContentProps, toast } from "react-toastify";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export const Toaster = () => {
  return (
    <ToastContainer
      position="bottom-center"
      hideProgressBar
      closeButton={false}
      icon={false}
      newestOnTop
      // Neutralise le chrome par défaut de react-toastify : seul le ToasterItem
      // (carte DS) est visible.
      toastClassName="!bg-transparent !p-0 !shadow-none !min-h-0 !mb-2 !rounded-none"
      className="!w-auto !max-w-[min(28rem,92vw)] !p-3"
    />
  );
};

export const ToasterItem = ({
  children,
  closeToast,
  closeButton = false,
  className,
  type = "info",
  onDrop,
}: {
  children: React.ReactNode;
  closeButton?: boolean;
  className?: string;
  type?: "error" | "info";
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
} & Partial<ToastContentProps>) => {
  return (
    <div
      onDrop={(event) => onDrop?.(event)}
      className={cn(
        // `.sahla-ds` : reset scopé sur le contenu portalé (toast hors du DS).
        "sahla-ds flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg",
        type === "error" && "border-destructive/40",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {closeButton && (
        <button
          type="button"
          onClick={closeToast}
          aria-label="Fermer"
          className={cn(
            "shrink-0 rounded-sm text-muted-foreground outline-none transition-colors",
            "hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
          )}
        >
          <X aria-hidden />
        </button>
      )}
    </div>
  );
};

export const addToast = (
  children: React.ReactNode,
  options: Parameters<typeof toast>[1] = {},
) => {
  return toast(children, {
    position: "bottom-center",
    closeButton: false,
    autoClose: 8000,
    hideProgressBar: true,
    ...options,
  });
};
