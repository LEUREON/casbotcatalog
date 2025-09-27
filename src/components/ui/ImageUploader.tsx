import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  onFileChange: (file: File | null) => void;
  currentImageUrl?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, onFileChange, currentImageUrl }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileChange(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const imageToShow = preview || (currentImageUrl && !currentImageUrl.endsWith('undefined') ? currentImageUrl : null);

  return (
    <div>
      <label className="block mb-1 text-sm text-white/70">{label}</label>
      <div 
        className="relative aspect-square w-full bg-black/20 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors"
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        {imageToShow ? (
          <>
            <img src={imageToShow} alt="Preview" className="object-cover w-full h-full rounded-md" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); 
                handleRemoveImage();
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500"
              title="Удалить изображение"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="text-center text-white/50">
            <UploadCloud size={32} className="mx-auto" />
            <p className="mt-2 text-sm">Нажмите, чтобы загрузить</p>
          </div>
        )}
      </div>
    </div>
  );
};