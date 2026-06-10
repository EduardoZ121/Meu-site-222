import { toast } from "sonner";

export function dismissUploadToasts() {
  toast.dismiss("rp-upload-error");
  toast.dismiss("rp-upload-warn");
  toast.dismiss("rp-upload-ok");
}

export function showUploadError(message) {
  dismissUploadToasts();
  toast.error(message, { id: "rp-upload-error", duration: 6000 });
}
