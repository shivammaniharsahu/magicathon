"use client";

import * as React from "react";
import { Camera, Loader2, RefreshCcw, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Returns a blob URL (object URL) for the captured image — caller is responsible
  // for using it or revoking it. We don't upload here.
  onCapture: (url: string) => void;
}

export function WebcamCaptureDialog({ open, onOpenChange, onCapture }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [state, setState] = React.useState<"idle" | "starting" | "live" | "preview" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [facing, setFacing] = React.useState<"user" | "environment">("user");

  // Start / restart camera whenever the dialog opens, the user retakes,
  // or the facing mode flips.
  React.useEffect(() => {
    if (!open || state === "preview") return;
    let cancelled = false;

    const start = async () => {
      setState("starting");
      setErrorMsg(null);
      try {
        // Stop any prior stream first
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setState("live");
      } catch (err) {
        if (cancelled) return;
        const msg = (err as Error).message || "Camera access denied.";
        setErrorMsg(msg);
        setState("error");
      }
    };

    start();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facing]);

  // Stop the stream when closing
  React.useEffect(() => {
    if (open) return;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("idle");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [open]);

  const snap = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      toast.error("Camera isn't ready yet.");
      return;
    }
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;
    // Use the smaller dimension to square-crop for the meme aspect ratio.
    const size = Math.min(w, h);
    const sx = (w - size) / 2;
    const sy = (h - size) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Canvas not supported.");
      return;
    }
    // Mirror the front-facing camera so it matches what the user sees.
    if (facing === "user") {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Couldn't capture frame.");
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setState("preview");
        // Pause the stream while previewing
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      },
      "image/jpeg",
      0.92,
    );
  };

  const useShot = () => {
    if (!previewUrl) return;
    const url = previewUrl;
    // Clear the local preview state WITHOUT revoking, so the close-cleanup
    // effect can't kill the URL the parent now owns. The parent keeps the
    // URL alive for as long as it uses it.
    setPreviewUrl(null);
    onCapture(url);
    onOpenChange(false);
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState("starting");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-brand-glow" /> Take a photo
          </DialogTitle>
          <DialogDescription>
            Snap a selfie (or anything in view) → it becomes your meme background.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/70">
          {state === "preview" && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="capture preview" className="h-full w-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
              autoPlay
              playsInline
              muted
            />
          )}

          {(state === "starting" || state === "idle") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-brand-glow" />
              <p className="text-xs text-muted-foreground">Waking up the camera…</p>
            </div>
          )}

          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center backdrop-blur-sm">
              <X className="h-8 w-8 text-danger" />
              <p className="text-sm text-foreground">Camera unavailable</p>
              <p className="max-w-sm text-[11px] text-muted-foreground">
                {errorMsg}. If you denied access, allow it in your browser&apos;s site settings and reopen this dialog.
              </p>
            </div>
          )}

          {state === "live" && (
            <button
              type="button"
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black/80"
              title="Switch camera"
            >
              <RefreshCcw className="h-3 w-3" /> flip
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {state === "preview" ? (
              <>
                <Button variant="glass" onClick={retake}>
                  <RefreshCcw className="h-4 w-4" /> Retake
                </Button>
                <Button onClick={useShot}>
                  Use this photo
                </Button>
              </>
            ) : (
              <Button onClick={snap} disabled={state !== "live"}>
                <Camera className="h-4 w-4" /> Snap
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
