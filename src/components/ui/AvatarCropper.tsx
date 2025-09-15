// project/src/components/ui/AvatarCropper.tsx
import React, { useEffect, useRef } from "react";

type AvatarCropperProps = {
  src: string;
  size?: number;
  quality?: number;
  onCropped: (file: File | null) => void;
  className?: string;
};

export default function AvatarCropper({ src, size = 512, quality = 0.9, onCropped, className = "" }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!src) { onCropped(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(size / iw, size / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (size - dw) / 2;
      const dy = (size - dh) / 2;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, dx, dy, dw, dh);
      canvas.toBlob((blob) => {
        if (!blob) { onCropped(null); return; }
        const f = new File([blob], "avatar.webp", { type: "image/webp" });
        onCropped(f);
      }, "image/webp", quality);
    };
    img.onerror = () => onCropped(null);
    img.src = src;
  }, [src, size, quality, onCropped]);

  return (
    <div className={["rounded-full overflow-hidden border border-white/10", className].join(" ")} style={{ width: 56, height: 56 }}>
      {src ? <img src={src} alt="preview" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
