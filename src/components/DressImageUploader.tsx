
import { useEffect } from 'react';
import { uploadDressImagesToSupabase } from '../utils/uploadDressImages';
import { Button } from './ui/button';
import { toast } from 'sonner';

// This is a one-time utility component to upload dress images to Supabase
// It can be removed after the initial setup is complete
export const DressImageUploader = () => {
  const handleUpload = async () => {
    try {
      toast.info('Uploading dress images to Supabase...');
      await uploadDressImagesToSupabase();
      toast.success('All dress images uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload dress images:', error);
      toast.error('Failed to upload dress images');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleUpload}
        className="bg-[#E799AA] hover:bg-[#E799AA]/90"
      >
        Upload Dress Images to Supabase
      </Button>
    </div>
  );
};
