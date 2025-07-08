
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ImageUpload } from '../components/ImageUpload';
import { OutfitSelector } from '../components/OutfitSelector';
import { ResultDisplay } from '../components/ResultDisplay';
import { TryOnButton } from '../components/TryOnButton';
import { DressImageUploader } from '../components/DressImageUploader';
import { supabaseService, TryOnSession } from '../services/supabaseService';

const Index = () => {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [selectedDress, setSelectedDress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<TryOnSession | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  // Subscribe to session updates
  useEffect(() => {
    if (!currentSession) return;

    const unsubscribe = supabaseService.subscribeToSession(
      currentSession.id,
      (updatedSession) => {
        console.log('Session updated:', updatedSession);
        setCurrentSession(updatedSession);
        
        if (updatedSession.status === 'completed' && updatedSession.result_image_url) {
          setResultImage(updatedSession.result_image_url);
          setIsProcessing(false);
          toast.success('Virtual try-on completed!');
        } else if (updatedSession.status === 'failed') {
          setIsProcessing(false);
          toast.error('Try-on processing failed. Please try again.');
        }
      }
    );

    return unsubscribe;
  }, [currentSession]);

  // Show uploader button for initial setup (can be removed later)
  useEffect(() => {
    // Show uploader button if we're in development mode or if there's a special query param
    const urlParams = new URLSearchParams(window.location.search);
    setShowUploader(urlParams.get('setup') === 'true' || process.env.NODE_ENV === 'development');
  }, []);

  const handleModelUpload = (file: File) => {
    setModelImage(file);
    console.log('Model image uploaded:', file.name);
  };

  const handleDressSelect = (dressUrl: string) => {
    setSelectedDress(dressUrl);
    console.log('Dress selected (Supabase URL):', dressUrl);
  };

  const handleTryOn = async () => {
    if (!modelImage) {
      toast.error('Please upload your photo first');
      return;
    }

    if (!selectedDress) {
      toast.error('Please select an outfit');
      return;
    }

    setIsProcessing(true);
    setResultImage(null);
    setCurrentSession(null);
    
    try {
      console.log('Starting virtual try-on process...');
      
      // Upload model image to Supabase
      const modelImagePath = `model-images/${Date.now()}-${modelImage.name}`;
      const modelImageUrl = await supabaseService.uploadImage(modelImage, modelImagePath);
      
      // Use selected dress URL directly (Supabase public URL from database)
      const dressImageUrl = selectedDress;
      
      // Create session in database with both URLs
      const session = await supabaseService.createSession(modelImageUrl, dressImageUrl);
      setCurrentSession(session);
      
      console.log('Session created with Supabase dress URL:', session);
      toast.success('Images uploaded! Processing your try-on...');
      
      // The n8n AI workflow will process the images and update the session
      
    } catch (error) {
      console.error('Try-on failed:', error);
      setIsProcessing(false);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E799AA]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-[#E799AA]">
            Fairyfrills Virtual Try-On
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
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#E799AA]/20 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#E799AA] rounded-full"></div>
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
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-[#E799AA]/20 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#E799AA] rounded-full"></div>
                Choose Your Outfit
              </h2>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Select from Our Collection</h3>
                <OutfitSelector
                  onSelect={handleDressSelect}
                  selectedDress={selectedDress}
                />
              </div>
            </div>

            {/* Try On Button */}
            <TryOnButton
              onClick={handleTryOn}
              disabled={!modelImage || !selectedDress}
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

      {/* One-time setup utility - can be removed after initial setup */}
      {showUploader && <DressImageUploader />}
    </div>
  );
};

export default Index;
