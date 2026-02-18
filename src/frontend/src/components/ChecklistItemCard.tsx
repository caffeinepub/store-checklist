import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle2 } from 'lucide-react';
import CameraCaptureModal from './CameraCaptureModal';

interface ChecklistItemCardProps {
  itemName: string;
  photo?: { file: File; previewUrl: string };
  onPhotoCapture: (file: File) => void;
  disabled?: boolean;
}

export default function ChecklistItemCard({ itemName, photo, onPhotoCapture, disabled }: ChecklistItemCardProps) {
  const [showCamera, setShowCamera] = useState(false);

  const handleCapture = (file: File) => {
    onPhotoCapture(file);
    setShowCamera(false);
  };

  return (
    <>
      <Card className="glass-subtle shadow-glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            {itemName}
            {photo && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {photo ? (
            <div className="aspect-video bg-muted/50 rounded-lg overflow-hidden ring-1 ring-border/50">
              <img
                src={photo.previewUrl}
                alt={itemName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm ring-1 ring-border/50">
              No photo captured
            </div>
          )}
          <Button
            onClick={() => setShowCamera(true)}
            disabled={disabled}
            variant={photo ? 'outline' : 'default'}
            className={photo ? 'w-full glass-subtle' : 'w-full shadow-glass'}
            size="sm"
          >
            <Camera className="h-4 w-4 mr-2" />
            {photo ? 'Retake Photo' : 'Capture Photo'}
          </Button>
        </CardContent>
      </Card>

      <CameraCaptureModal
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
        title={`Capture: ${itemName}`}
      />
    </>
  );
}
