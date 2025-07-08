
import { useState } from 'react';
import { Button } from './ui/button';
import { uploadAllDressImages } from '../utils/uploadDressImages';
import { toast } from 'sonner';

export const DressImageUploader = () => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      await uploadAllDressImages();
      toast.success('All dress images uploaded to Supabase successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload dress images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={handleUpload} 
        disabled={isUploading}
        className="bg-[#E799AA] hover:bg-[#E799AA]/80"
      >
        {isUploading ? 'Uploading...' : 'Upload Dress Images to Supabase'}
      </Button>
    </div>
  );
};
