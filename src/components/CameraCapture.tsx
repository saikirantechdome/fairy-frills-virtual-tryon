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
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set all video attributes before stream
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        
        // Set the stream
        video.srcObject = stream;
        streamRef.current = stream;
        
        // Mark active before video loads to show container
        setIsActive(true);
        
        // Force video to load and play
        video.load();
        
        // Wait for video to be ready
        const playVideo = async () => {
          try {
            await video.play();
            console.log('Video is now playing successfully');
          } catch (playErr) {
            console.error('Error playing video:', playErr);
            // Try again in case of temporary issues
            setTimeout(async () => {
              try {
                await video.play();
                console.log('Video playing on retry');
              } catch (retryErr) {
                console.error('Retry failed:', retryErr);
              }
            }, 100);
          }
        };

        if (video.readyState >= 1) {
          await playVideo();
        } else {
          video.addEventListener('loadedmetadata', playVideo, { once: true });
        }
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
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">{error}</p>
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
            <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Camera Capture</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Take a photo using your device's camera
          </p>
          <Button 
            onClick={startCamera} 
            disabled={isStarting}
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            {isStarting ? 'Starting Camera...' : 'Start Camera'}
          </Button>
        </div>
      )}

      {isActive && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay={true}
            playsInline={true}
            muted={true}
            className="w-full h-80 sm:h-96 rounded-lg bg-card border border-border object-cover"
            style={{ 
              minHeight: '320px',
              backgroundColor: 'hsl(var(--card))'
            }}
          />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={switchCamera}
              className="bg-background/80 border-border text-foreground hover:bg-background/90 backdrop-blur-sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={captureImage}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-16 h-16"
            >
              <Camera className="h-6 w-6" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              className="bg-background/80 border-border text-foreground hover:bg-background/90 backdrop-blur-sm"
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
              className="w-full max-h-96 object-contain rounded-lg border-2 border-border"
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
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/80"
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