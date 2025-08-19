import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '../lib/utils';
import { supabaseService } from '../services/supabaseService';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  className?: string;
}

export const CameraCapture = ({ onCapture, onCancel, className }: CameraCaptureProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isSandboxDetected, setIsSandboxDetected] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sandbox detection on component mount
  useEffect(() => {
    const detectSandbox = () => {
      try {
        // Check if we're in an iframe
        const inIframe = window.self !== window.top;
        
        // Check for common sandbox domains
        const sandboxDomains = ['lovableproject.com', 'sandbox', 'preview', 'codepen', 'jsfiddle'];
        const currentDomain = window.location.hostname.toLowerCase();
        const isDomainSandbox = sandboxDomains.some(domain => currentDomain.includes(domain));
        
        // Check if getUserMedia is available
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        
        setIsSandboxDetected(inIframe || isDomainSandbox || !hasMediaDevices);
      } catch (err) {
        console.warn('Sandbox detection failed:', err);
        setIsSandboxDetected(true);
      }
    };
    
    detectSandbox();
  }, []);

  const checkCameraSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { supported: false, message: 'Camera API not supported in this browser' };
    }
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      return { 
        supported: false, 
        message: 'Camera requires HTTPS or localhost. Please use a secure connection.' 
      };
    }
    
    return { supported: true, message: '' };
  }, []);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    
    const supportCheck = checkCameraSupport();
    if (!supportCheck.supported) {
      setError(supportCheck.message);
      setIsStarting(false);
      return;
    }
    
    try {
      // Try multiple constraint configurations for better compatibility
      const constraintOptions = [
        {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          }
        },
        {
          video: {
            facingMode: facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        },
        {
          video: { facingMode: facingMode }
        },
        {
          video: true // Fallback to basic constraints
        }
      ];

      let stream = null;
      let lastError = null;

      for (const constraints of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
          console.warn('Failed with constraints:', constraints, err);
        }
      }

      if (!stream) {
        throw lastError || new Error('Could not access camera with any configuration');
      }
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set all video attributes
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        
        video.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        
        // Enhanced video loading with better error handling
        const playVideo = async () => {
          try {
            video.load();
            await video.play();
            console.log('Camera preview started successfully');
          } catch (playErr) {
            console.error('Error playing video:', playErr);
            // Multiple retry attempts with different approaches
            for (let i = 0; i < 3; i++) {
              try {
                await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
                await video.play();
                console.log(`Video playing on retry attempt ${i + 1}`);
                return;
              } catch (retryErr) {
                console.warn(`Retry ${i + 1} failed:`, retryErr);
              }
            }
            throw playErr;
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
      let errorMessage = '';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = isSandboxDetected 
          ? 'Camera blocked in sandbox environment. Try opening in a new tab or allow camera access.'
          : 'Camera access denied. Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Try Chrome, Firefox, or Safari.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Trying basic camera access...';
        // Auto-retry with basic constraints
        setTimeout(() => {
          setFacingMode('user');
          startCamera();
        }, 1000);
        return;
      } else {
        errorMessage = isSandboxDetected 
          ? 'Camera unavailable in sandbox. Please try in a new browser tab.'
          : 'Failed to access camera. Check permissions and try again.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, checkCameraSupport, isSandboxDetected]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
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
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob and create image URL
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
        toast.success('Photo captured successfully!');
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
      await new Promise((resolve) => {
        canvasRef.current!.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { 
              type: 'image/jpeg' 
            });
            
            onCapture(file);
            toast.success('Photo ready for processing!');
            resolve(void 0);
          }
        }, 'image/jpeg', 0.9);
      });

      // Clean up and close modal
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
      setIsModalOpen(false);
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
      setTimeout(startCamera, 100);
    }
  }, [isActive, stopCamera, startCamera]);

  const handleModalClose = useCallback(() => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setError(null);
    setIsModalOpen(false);
  }, [stopCamera, capturedImage]);

  const handleCancel = useCallback(() => {
    handleModalClose();
    onCancel();
  }, [handleModalClose, onCancel]);

  const openCameraModal = useCallback(() => {
    setIsModalOpen(true);
    setTimeout(startCamera, 300); // Small delay for modal animation
  }, [startCamera]);

  // Render sandbox warning
  const renderSandboxWarning = () => (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Sandbox Environment Detected
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Camera may not work properly in preview mode. For best results, open in a new tab or deploy your app.
          </p>
        </div>
      </div>
    </div>
  );

  // Render camera modal content
  const renderCameraModal = () => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Capture
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-4 pt-2 flex flex-col">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-destructive text-sm">{error}</p>
              </div>
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
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8">
                <div className="mb-4">
                  <Smartphone className="h-16 w-16 mx-auto text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Capture</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Position yourself in front of the camera and take a photo when ready
                </p>
                <Button 
                  onClick={startCamera} 
                  disabled={isStarting}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isStarting ? 'Starting Camera...' : 'Start Camera'}
                </Button>
              </div>
            </div>
          )}

          {isActive && (
            <div className="flex-1 flex flex-col">
              <div className="relative flex-1 min-h-0">
                <video
                  ref={videoRef}
                  autoPlay={true}
                  playsInline={true}
                  muted={true}
                  className="w-full h-full rounded-lg bg-card border border-border object-cover"
                  style={{ 
                    minHeight: '300px',
                    maxHeight: '70vh',
                    backgroundColor: 'hsl(var(--card))'
                  }}
                />
                
                <div className="absolute top-4 right-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={switchCamera}
                    className="bg-background/80 border-border text-foreground hover:bg-background/90 backdrop-blur-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-center gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleModalClose}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                
                <Button
                  onClick={captureImage}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-16 h-16"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="flex-1 flex flex-col">
              <div className="relative flex-1 min-h-0 mb-4">
                <img
                  src={capturedImage}
                  alt="Captured photo"
                  className="w-full h-full object-contain rounded-lg border-2 border-border"
                  style={{ maxHeight: '70vh' }}
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
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
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
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {isSandboxDetected && renderSandboxWarning()}
      
      <div className="text-center py-8">
        <div className="mb-4">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Camera Capture</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Take a photo using your device's camera
        </p>
        <Button 
          onClick={openCameraModal}
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Open Camera
        </Button>
      </div>

      {renderCameraModal()}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};