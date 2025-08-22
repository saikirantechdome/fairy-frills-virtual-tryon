import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Camera, Upload, X, Circle, FolderOpen, Maximize2, ExternalLink, AlertCircle } from 'lucide-react';

interface CameraUploadProps {
  onImageCapture?: (file: File) => void;
  onFileUpload?: (file: File) => void;
}

type UploadState = 'idle' | 'device-upload' | 'camera-preview' | 'image-captured';

export const CameraUpload: React.FC<CameraUploadProps> = ({
  onImageCapture,
  onFileUpload,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSandboxDetected, setIsSandboxDetected] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced sandbox detection on component mount
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

  // Start camera stream with enhanced error handling
  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setCameraError(null);
    setIsVideoReady(false);
    
    const supportCheck = checkCameraSupport();
    if (!supportCheck.supported) {
      setCameraError(supportCheck.message);
      setIsStarting(false);
      return;
    }
    
    // Show camera modal first
    setShowCameraModal(true);
    setUploadState('camera-preview');

    try {
      // Try multiple constraint configurations for better compatibility
      const constraintOptions = [
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          }
        },
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        },
        {
          video: { facingMode: 'environment' }
        },
        {
          video: { facingMode: 'user' } // Fallback to front camera
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

      console.log('Camera stream obtained:', stream);
      setCameraStream(stream);

      // Set up video element when stream is ready
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set all video attributes for better compatibility
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        
        video.srcObject = stream;
        
        // Enhanced video loading with better error handling
        const playVideo = async () => {
          try {
            video.load();
            await video.play();
            console.log('Camera preview started successfully');
            setIsVideoReady(true);
          } catch (playErr) {
            console.error('Error playing video:', playErr);
            // Multiple retry attempts with different approaches
            for (let i = 0; i < 3; i++) {
              try {
                await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
                await video.play();
                console.log(`Video playing on retry attempt ${i + 1}`);
                setIsVideoReady(true);
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

      toast({
        title: "Camera activated",
        description: "Live preview is ready for capture",
      });
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = '';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = isSandboxDetected 
          ? 'Camera blocked in sandbox environment. Try opening in a new tab or allow camera access.'
          : 'Camera access denied. Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Try Chrome, Firefox, or Safari.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Trying basic camera access...';
      } else {
        errorMessage = isSandboxDetected 
          ? 'Camera unavailable in sandbox. Please try in a new browser tab.'
          : 'Failed to access camera. Check permissions and try again.';
      }
      
      setCameraError(errorMessage);
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive",
      });
      setUploadState('idle');
      setShowCameraModal(false);
    } finally {
      setIsStarting(false);
    }
  }, [checkCameraSupport, isSandboxDetected]);

  // Stop camera stream
  const stopCamera = useCallback((keepCapturedState = false) => {
    console.log('Stopping camera...');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped');
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (!keepCapturedState) {
      setUploadState('idle');
    }
    setShowCameraModal(false);
    setIsVideoReady(false);
    setCameraError(null);
  }, [cameraStream]);

  // Capture image from video
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Canvas context not available');
      return;
    }

    console.log('Capturing image...');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Show validation loading
        toast({
          title: "Validating photo...",
          description: "Please wait while we validate your photo",
        });

        try {
          // Validate the photo using Google Cloud Vision API
          const { PhotoValidationService } = await import('../services/photoValidationService');
          const validation = await PhotoValidationService.validatePhoto(file);
          
          if (!validation.isValid) {
            toast({
              title: "Validation failed",
              description: validation.reason || 'Please capture a baby photo with dress for try-on.',
              variant: "destructive",
            });
            
            // Show retake option by keeping camera active
            return;
          }

          // Create preview URL
          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);
          setUploadState('image-captured');

          // Stop camera after capture but keep captured state
          stopCamera(true);

          // Call callback with captured file
          onImageCapture?.(file);

          console.log('Photo captured and validated successfully');
          toast({
            title: "Photo validated!",
            description: "Your photo has been validated and is ready for try-on",
          });
        } catch (error) {
          console.error('Validation error:', error);
          toast({
            title: "Validation error",
            description: "Failed to validate photo. Please try again.",
            variant: "destructive",
          });
        }
      }
    }, 'image/jpeg', 0.9);
  }, [onImageCapture, stopCamera]);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      setUploadState('image-captured');
      onFileUpload?.(file);

      toast({
        title: "Image uploaded!",
        description: `Successfully uploaded ${file.name}`,
      });
    }
  }, [onFileUpload]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      const imageUrl = URL.createObjectURL(imageFile);
      setCapturedImage(imageUrl);
      setUploadState('image-captured');
      onFileUpload?.(imageFile);

      toast({
        title: "Image uploaded!",
        description: `Successfully uploaded ${imageFile.name}`,
      });
    }
  }, [onFileUpload]);


  const renderUploadOptions = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-12 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          <FolderOpen className="w-4 h-4 mr-2 text-primary-foreground" />
          Upload from Device
        </Button>
        
        <Button
          onClick={startCamera}
          variant="outline"
          className="flex-1 h-12 text-sm font-medium border-border hover:bg-secondary"
          size="lg"
          disabled={isStarting}
        >
          <Camera className="w-4 h-4 mr-2" />
          {isStarting ? 'Starting Camera...' : 'Use Camera'}
        </Button>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>Or drag and drop an image here</p>
        <p className="text-xs mt-1">Supports JPG, PNG, GIF up to 10MB</p>
      </div>
    </div>
  );

  const renderCameraModal = () => (
    <Dialog open={showCameraModal} onOpenChange={(open) => {
      if (!open) stopCamera(false);
    }}>
      <DialogContent className="sm:max-w-[90vw] max-w-[95vw] h-[90vh] max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Preview
          </DialogTitle>
          <DialogDescription>
            Position yourself and click capture when ready
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 p-4 pt-2 flex flex-col">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Camera Access Failed</h3>
                <p className="text-muted-foreground mb-4">{cameraError}</p>
                {isSandboxDetected && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">
                      🔒 You're in preview mode. For full camera access:
                    </p>
                    <ul className="text-sm mt-2 space-y-1 text-left">
                      <li>• Set up a custom domain</li>
                      <li>• Export to GitHub and run locally</li>
                      <li>• Deploy to a hosting service</li>
                    </ul>
                  </div>
                )}
              </div>
              <Button onClick={() => stopCamera(false)} variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              <div className="relative bg-card rounded-lg overflow-hidden flex-1">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover bg-card"
                  style={{ 
                    minHeight: '300px',
                    maxHeight: '70vh',
                    backgroundColor: 'hsl(var(--card))'
                  }}
                />
                {!isVideoReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card text-card-foreground">
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
                      <p>Initializing camera...</p>
                      <p className="text-sm opacity-75 mt-1">Please allow camera access</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={captureImage}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                  disabled={!isVideoReady}
                >
                  <Circle className="w-6 h-6 mr-2" />
                  Capture Photo
                </Button>
                
                <Button
                  onClick={() => stopCamera(false)}
                  variant="outline"
                  className="h-12 border-border hover:bg-secondary"
                  size="lg"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderCapturedImage = () => (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-card border border-border">
        <img
          src={capturedImage!}
          alt="Captured"
          className="w-full h-[400px] object-contain bg-muted"
        />
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setCapturedImage(null);
            setUploadState('idle');
          }}
          variant="outline"
          className="flex-1 h-12 border-border hover:bg-secondary"
          size="lg"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Another
        </Button>
        
        <Button
          onClick={() => {
            setCapturedImage(null);
            setUploadState('idle');
          }}
          variant="outline"
          className="h-12 border-border hover:bg-secondary"
          size="lg"
        >
          <X className="w-4 h-4" />
          Remove
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-xl mx-auto">
      <Card 
        className={`
          p-4 border-2 border-dashed transition-all duration-200
          ${isDragging ? 'border-primary bg-secondary animate-pulse' : 'border-border bg-card'}
          ${uploadState === 'camera-preview' ? 'border-primary' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="mb-4">
            {uploadState === 'idle' && (
              <div className="w-12 h-12 mx-auto bg-primary rounded-full flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
            )}
            
            <h3 className="text-xl font-bold text-foreground mb-2">
              {uploadState === 'idle' && 'Upload Your Image'}
              {uploadState === 'camera-preview' && 'Camera Preview'}
              {uploadState === 'image-captured' && 'Image Ready'}
            </h3>
            
            <p className="text-sm text-muted-foreground">
              {uploadState === 'idle' && 'Choose how you want to add your image'}
              {uploadState === 'camera-preview' && 'Position yourself and click capture when ready'}
              {uploadState === 'image-captured' && 'Your image has been processed successfully'}
            </p>
          </div>

          {uploadState === 'idle' && renderUploadOptions()}
          {uploadState === 'image-captured' && renderCapturedImage()}
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera Modal */}
      {renderCameraModal()}
    </div>
  );
};