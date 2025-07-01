
import { useState } from 'react';
import { toast } from 'sonner';
import { ImageUpload } from '../components/ImageUpload';
import { OutfitSelector } from '../components/OutfitSelector';
import { ResultDisplay } from '../components/ResultDisplay';
import { TryOnButton } from '../components/TryOnButton';

const Index = () => {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [dressImage, setDressImage] = useState<File | null>(null);
  const [selectedDress, setSelectedDress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleModelUpload = (file: File) => {
    setModelImage(file);
    console.log('Model image uploaded:', file.name);
  };

  const handleDressUpload = (file: File) => {
    setDressImage(file);
    setSelectedDress(null); // Clear predefined selection
    console.log('Dress image uploaded:', file.name);
  };

  const handleDressSelect = (dressUrl: string) => {
    setSelectedDress(dressUrl);
    setDressImage(null); // Clear uploaded file
    console.log('Dress selected:', dressUrl);
  };

  const handleTryOn = async () => {
    if (!modelImage) {
      toast.error('Please upload your photo first');
      return;
    }

    if (!dressImage && !selectedDress) {
      toast.error('Please select or upload an outfit');
      return;
    }

    setIsProcessing(true);
    setResultImage(null);
    
    try {
      // For now, we'll simulate the process
      // In a real implementation, this would send to n8n webhook
      console.log('Starting virtual try-on process...');
      console.log('Model image:', modelImage);
      console.log('Dress image:', dressImage || selectedDress);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demo purposes, we'll show a placeholder result
      setResultImage('https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80');
      
      toast.success('Virtual try-on completed!');
    } catch (error) {
      console.error('Try-on failed:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Virtual Try-On Studio
          </h1>
          <p className="text-gray-600 mt-1">AI-powered fashion fitting experience</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload Section */}
          <div className="space-y-6">
            {/* Model Photo Upload */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Upload Your Photo
              </h2>
              <ImageUpload
                onUpload={handleModelUpload}
                accept="image/*"
                uploadedFile={modelImage}
                placeholder="Drag & drop your photo here or click to upload"
              />
            </div>

            {/* Dress Selection */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-purple-100 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                Choose Your Outfit
              </h2>
              
              {/* Upload Custom Dress */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Custom Outfit</h3>
                <ImageUpload
                  onUpload={handleDressUpload}
                  accept="image/*"
                  uploadedFile={dressImage}
                  placeholder="Upload dress image"
                />
              </div>

              {/* Predefined Outfits */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Or Select from Samples</h3>
                <OutfitSelector
                  onSelect={handleDressSelect}
                  selectedDress={selectedDress}
                />
              </div>
            </div>

            {/* Try On Button */}
            <TryOnButton
              onClick={handleTryOn}
              disabled={!modelImage || (!dressImage && !selectedDress)}
              isProcessing={isProcessing}
            />
          </div>

          {/* Right Column - Result Section */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ResultDisplay
              isProcessing={isProcessing}
              resultImage={resultImage}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
