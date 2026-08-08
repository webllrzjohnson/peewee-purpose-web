import { toast as sonnerToast } from "sonner";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

function showToast({ title, description, variant = "default" }: ToastOptions) {
  const message = title ?? description ?? "Notification";
  const options = description && title ? { description } : undefined;

  if (variant === "destructive") {
    return sonnerToast.error(message, options);
  }

  return sonnerToast.success(message, options);
}

export function useToast() {
  return { toast: showToast };
}
