
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CameraUpload } from '../components/CameraUpload';
import { OutfitSelector } from '../components/OutfitSelector';
import { ResultDisplay } from '../components/ResultDisplay';
import { TryOnButton } from '../components/TryOnButton';
import { DressImageUploader } from '../components/DressImageUploader';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService, TryOnSession, ResultMessage } from '../services/supabaseService';

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [selectedDress, setSelectedDress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<TryOnSession | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Poll session status every 3 seconds when processing
  useEffect(() => {
    if (!currentSession || !isProcessing) return;

    const pollInterval = setInterval(async () => {
      try {
        const session = await supabaseService.getSession(currentSession.id);
        
        if (session) {
          console.log('Session status:', session);
          
          if (session.status === 'completed' && session.result_image_url) {
            setResultImage(session.result_image_url);
            setIsProcessing(false);
            setErrorMessage(null);
            toast.success('Virtual try-on completed!');
            clearInterval(pollInterval);
          } else if (session.status === 'failed') {
            setIsProcessing(false);
            setResultImage(null);
            setErrorMessage(session.result_message || 'Something went wrong. Please try again.');
            toast.error(session.result_message || 'Try-on processing failed. Please try again.');
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling session:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [currentSession, isProcessing]);

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
    setErrorMessage(null);
    
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

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E799AA]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#E799AA]">
                Fairyfrills Virtual Try-On
              </h1>
              <p className="text-gray-600 mt-1">AI-powered fashion fitting experience</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{profile?.name || user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
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
              <CameraUpload
                onImageCapture={handleModelUpload}
                onFileUpload={handleModelUpload}
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
              errorMessage={errorMessage}
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
