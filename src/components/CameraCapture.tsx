import { useState, useRef, useCallback } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { supabaseService } from '../services/supabaseService';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  className?: string;
}

export const CameraCapture = ({ onCapture, onCancel, className }: CameraCaptureProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1024 },
          height: { ideal: 1536 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this browser.';
      } else {
        errorMessage += 'Please check your camera permissions.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsStarting(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob and create image URL
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    startCamera();
  }, [capturedImage, startCamera]);

  const confirmCapture = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    setIsProcessing(true);
    
    try {
      // Convert canvas to File
      await new Promise((resolve) => {
        canvasRef.current!.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { 
              type: 'image/jpeg' 
            });
            
            onCapture(file);
            resolve(void 0);
          }
        }, 'image/jpeg', 0.9);
      });

      // Clean up
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    } catch (error) {
      console.error('Error processing captured image:', error);
      toast.error('Failed to process captured image');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(current => current === 'user' ? 'environment' : 'user');
    if (isActive) {
      stopCamera();
      // Restart with new facing mode
      setTimeout(startCamera, 100);
    }
  }, [isActive, stopCamera, startCamera]);

  const handleCancel = useCallback(() => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setError(null);
    onCancel();
  }, [stopCamera, capturedImage, onCancel]);

  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
          <Button 
            onClick={() => setError(null)} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {!isActive && !capturedImage && !error && (
        <div className="text-center py-8">
          <div className="mb-4">
            <Camera className="h-16 w-16 mx-auto text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Camera Capture</h3>
          <p className="text-sm text-gray-600 mb-4">
            Take a photo using your device's camera
          </p>
          <Button 
            onClick={startCamera} 
            disabled={isStarting}
            className="bg-[#E799AA] hover:bg-[#E799AA]/80"
          >
            {isStarting ? 'Starting Camera...' : 'Start Camera'}
          </Button>
        </div>
      )}

      {isActive && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-96 rounded-lg bg-black"
          />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={switchCamera}
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={captureImage}
              size="lg"
              className="bg-white text-black hover:bg-gray-100 rounded-full w-16 h-16"
            >
              <Camera className="h-6 w-6" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
            />
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={retakePhoto}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
            
            <Button
              onClick={confirmCapture}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#E799AA] hover:bg-[#E799AA]/80"
            >
              <Check className="h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Use Photo'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};