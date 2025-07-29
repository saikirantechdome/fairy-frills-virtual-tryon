
import { useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ResultDisplayProps {
  isProcessing: boolean;
  resultImage: string | null;
  errorMessage?: string | null;
}

export const ResultDisplay = ({ isProcessing, resultImage, errorMessage }: ResultDisplayProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDownload = async () => {
    if (resultImage) {
      try {
        const response = await fetch(resultImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'virtual-try-on-result.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Image downloaded successfully!');
      } catch (error) {
        console.error('Download failed:', error);
        toast.error('Download failed. Please try again.');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && resultImage) {
      try {
        await navigator.share({
          title: 'Virtual Try-On Result',
          text: 'Check out my virtual try-on result!',
          url: resultImage,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        toast.error('Sharing not supported on this device');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(resultImage || '');
      toast.success('Image URL copied to clipboard!');
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        Virtual Try-On Result
      </h2>
      
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
        {isProcessing ? (
          // Processing state
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-700 font-medium">Generating your look...</p>
              <p className="text-sm text-gray-500 mt-1">This may take 1 to 2 minutes. Please wait while your image is being processed.</p>
            </div>
          </div>
        ) : resultImage ? (
          // Result state
          <div className="relative h-full group">
            <img
              src={resultImage}
              alt="Virtual try-on result"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}
            
            {/* Action buttons overlay */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleShare}
                className="bg-white/90 hover:bg-white shadow-lg"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                className="bg-white/90 hover:bg-white shadow-lg"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : errorMessage ? (
          // Error state
          <div className="h-full flex flex-col items-center justify-center text-red-500">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-red-200 rounded-full"></div>
            </div>
            <p className="text-center text-red-600 font-medium mb-2">
              Try-on Failed
            </p>
            <p className="text-center text-red-500 text-sm px-4">
              {errorMessage}
            </p>
          </div>
        ) : (
          // Placeholder state
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
            <p className="text-center text-gray-600">
              Upload your photo and select an outfit to see the magic happen!
            </p>
          </div>
        )}
      </div>
      
      {resultImage && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      )}
    </div>
  );
};
