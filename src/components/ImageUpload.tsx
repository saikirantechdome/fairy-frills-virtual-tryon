
import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { CameraCapture } from './CameraCapture';

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
  const [showOptions, setShowOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
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
    setShowOptions(true);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setShowOptions(false);
  };

  const handleCameraOption = () => {
    setShowCamera(true);
    setShowOptions(false);
  };

  const handleCameraCapture = (file: File) => {
    onUpload(file);
    setShowCamera(false);
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
    setShowOptions(false);
  };

  const handleOptionsCancel = () => {
    setShowOptions(false);
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
      ) : showOptions ? (
        // Upload options state
        <div className="space-y-4">
          <div className="text-center py-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Upload Method</h3>
            <p className="text-sm text-gray-600 mb-6">How would you like to add your photo?</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handleCameraOption}
              variant="outline"
              className="h-20 flex flex-col items-center gap-2 border-2 hover:border-[#E799AA] hover:bg-[#E799AA]/5"
            >
              <Camera className="h-6 w-6 text-[#E799AA]" />
              <span className="text-sm font-medium">Use Camera</span>
            </Button>
            
            <Button
              onClick={handleFileUpload}
              variant="outline"
              className="h-20 flex flex-col items-center gap-2 border-2 hover:border-[#E799AA] hover:bg-[#E799AA]/5"
            >
              <Upload className="h-6 w-6 text-[#E799AA]" />
              <span className="text-sm font-medium">Upload from Device</span>
            </Button>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleOptionsCancel}
              variant="ghost"
              size="sm"
              className="text-gray-500"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : showCamera ? (
        // Camera capture state
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
        />
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
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Upload a clear, front-facing photo (PNG/JPG, max 10MB) in portrait orientation — 512×768 or 1024×1536 recommended.
                Ensure the face is well-lit, centered, not cropped, and fully visible. See example below.
              </p>
              <div className="mt-2 flex justify-center">
                <img 
                  src="/lovable-uploads/2e388f33-a93f-40c4-af57-0df691bf2dd8.png" 
                  alt="Example of good photo for virtual try-on" 
                  className="w-24 h-32 object-cover rounded border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
