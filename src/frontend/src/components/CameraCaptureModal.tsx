import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import { useCamera } from '../camera/useCamera';

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
}

export default function CameraCaptureModal({ open, onClose, onCapture, title = 'Capture Photo' }: CameraCaptureModalProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef
  } = useCamera({
    facingMode: 'environment',
    width: 1280,
    height: 720,
    quality: 0.9,
    format: 'image/jpeg'
  });

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [open]);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      onCapture(file);
      stopCamera();
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const getErrorMessage = () => {
    if (!error) return null;
    
    switch (error.type) {
      case 'permission':
        return 'Camera permission denied. Please allow camera access in your browser settings and try again.';
      case 'not-supported':
        return 'Camera is not supported in your browser. Please use a modern browser with camera support.';
      case 'not-found':
        return 'No camera found on your device. Please ensure your device has a camera.';
      case 'unknown':
        return error.message || 'An error occurred while accessing the camera.';
      default:
        return error.message || 'An error occurred while accessing the camera.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col p-0 gap-0 glass-strong shadow-glass-lg border-2">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 glass-subtle rounded-t-lg">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Position the item in the frame and capture the photo
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-4 pb-4">
            {isSupported === false && (
              <Alert variant="destructive" className="glass shadow-glass">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Camera is not supported in your browser. Please use a modern browser.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="glass shadow-glass">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{getErrorMessage()}</AlertDescription>
              </Alert>
            )}

            <div className="relative bg-black rounded-lg overflow-hidden w-full ring-2 ring-border/50" style={{ aspectRatio: '16/9' }}>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isActive ? 'block' : 'none' }}
              />
              {!isActive && !isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <p>Initializing camera...</p>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Pinned Footer with Safe Area */}
        <div className="shrink-0 glass-subtle px-6 py-4 safe-area-bottom rounded-b-lg">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose} className="glass-subtle">
              Cancel
            </Button>
            <Button
              onClick={handleCapture}
              disabled={!isActive || isLoading}
              className="shadow-glass"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
