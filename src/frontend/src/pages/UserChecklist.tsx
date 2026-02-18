import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import ChecklistItemCard from '../components/ChecklistItemCard';
import { useCreateChecklistEntry, useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useBackendActor } from '../hooks/useBackendActor';
import ProfileSetupModal from '../components/ProfileSetupModal';

const CHECKLIST_ITEMS = ['Back door', 'Front door', 'DT window locked', 'Cash collected'];

interface CapturedPhoto {
  file: File;
  previewUrl: string;
}

export default function UserChecklist() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [photos, setPhotos] = useState<Record<string, CapturedPhoto>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { actorReady, actorLoading, actorError, retry } = useBackendActor();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const createEntry = useCreateChecklistEntry();

  useEffect(() => {
    if (!identity) {
      navigate({ to: '/' });
    }
  }, [identity, navigate]);

  const handlePhotoCapture = (itemName: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    
    // Clean up old preview URL if exists
    if (photos[itemName]) {
      URL.revokeObjectURL(photos[itemName].previewUrl);
    }
    
    setPhotos(prev => ({
      ...prev,
      [itemName]: { file, previewUrl }
    }));
    setValidationError(null);
  };

  const handleSubmit = async () => {
    setValidationError(null);

    // Check if actor is ready
    if (!actorReady) {
      setValidationError('Connecting to backend service. Please wait...');
      return;
    }

    // Validate store name
    if (!storeName.trim()) {
      setValidationError('Please enter a store name.');
      return;
    }

    // Validate all photos are captured
    const missingPhotos = CHECKLIST_ITEMS.filter(item => !photos[item]);
    if (missingPhotos.length > 0) {
      setValidationError(`Please capture photos for: ${missingPhotos.join(', ')}`);
      return;
    }

    try {
      // Convert photos to backend format
      const items = await Promise.all(
        CHECKLIST_ITEMS.map(async (itemName) => {
          const photo = photos[itemName];
          const arrayBuffer = await photo.file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          
          return {
            name: itemName,
            photo: bytes
          };
        })
      );

      await createEntry.mutateAsync({
        storeName: storeName.trim(),
        items
      });

      // Show success and reset form
      setShowSuccess(true);
      setStoreName('');
      setPhotos({});
      
      // Clean up preview URLs
      Object.values(photos).forEach(photo => {
        URL.revokeObjectURL(photo.previewUrl);
      });

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      console.error('Submission error:', error);
      setValidationError(error.message || 'Failed to submit checklist. Please try again.');
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(photos).forEach(photo => {
        URL.revokeObjectURL(photo.previewUrl);
      });
    };
  }, []);

  const showProfileSetup = !!identity && !profileLoading && profileFetched && userProfile === null;
  const isSubmitDisabled = createEntry.isPending || !actorReady || actorLoading;

  if (!identity) {
    return null;
  }

  return (
    <>
      <ProfileSetupModal
        open={showProfileSetup}
        onSave={async (name) => {
          await saveProfile.mutateAsync({ name });
        }}
        isSaving={saveProfile.isPending}
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Store Checklist</CardTitle>
            <CardDescription>
              Complete all checklist items with photo proof
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {actorLoading && (
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Connecting to backend service...
                </AlertDescription>
              </Alert>
            )}

            {actorError && !actorLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{actorError}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retry}
                    className="ml-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Checklist submitted successfully!
                </AlertDescription>
              </Alert>
            )}

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                type="text"
                placeholder="Enter store name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={!actorReady}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Checklist Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CHECKLIST_ITEMS.map((item) => (
                  <ChecklistItemCard
                    key={item}
                    itemName={item}
                    photo={photos[item]}
                    onPhotoCapture={(file) => handlePhotoCapture(item, file)}
                    disabled={!actorReady}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full"
              size="lg"
            >
              {createEntry.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Checklist'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
