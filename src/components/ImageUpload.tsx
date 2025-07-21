
import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  uploadedFile?: File | null;
  placeholder?: string;
  className?: string;
}

export const ImageUpload = ({
  onUpload,
  accept = 'image/*',
  uploadedFile,
  placeholder = 'Drag & drop an image here or click to upload',
  className
}: ImageUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create preview URL when file is uploaded
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadedFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onUpload(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl ? (
        // Preview state
        <div className="relative group">
          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-64 object-contain"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <button
                onClick={handleRemove}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 truncate">
            {uploadedFile?.name}
          </div>
        </div>
      ) : (
        // Upload state
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
            isDragOver
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            {isDragOver ? (
              <Upload className="w-8 h-8 text-purple-500" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">
                {placeholder}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
