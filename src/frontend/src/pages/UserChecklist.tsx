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
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched, error: profileError } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const createEntry = useCreateChecklistEntry();

  useEffect(() => {
    if (!identity) {
      console.log('[UserChecklist] No identity, redirecting to login');
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
      console.log('[UserChecklist] Submitting checklist...');
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

      console.log('[UserChecklist] Checklist submitted successfully');
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
      console.error('[UserChecklist] Submission error:', error);
      // Display only the user-friendly message, technical details stay in console
      const userMessage = error.message || 'Failed to submit checklist. Please try again.';
      setValidationError(userMessage);
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

  const showProfileSetup = !!identity && !profileLoading && profileFetched && userProfile === null && !profileError;
  const isSubmitDisabled = createEntry.isPending || !actorReady || actorLoading;

  if (!identity) {
    return null;
  }

  return (
    <>
      <ProfileSetupModal
        open={showProfileSetup}
        onSave={async (name) => {
          try {
            console.log('[UserChecklist] Saving profile...');
            await saveProfile.mutateAsync({ name });
            console.log('[UserChecklist] Profile saved');
          } catch (error) {
            console.error('[UserChecklist] Profile save error:', error);
          }
        }}
        isSaving={saveProfile.isPending}
      />

      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="glass-strong shadow-glass-lg border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Store Checklist</CardTitle>
            <CardDescription>
              Complete all checklist items with photo proof
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {actorLoading && (
              <Alert className="glass shadow-glass bg-blue-50/70 dark:bg-blue-950/70 border-blue-200/50 dark:border-blue-800/50">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Connecting to backend service...
                </AlertDescription>
              </Alert>
            )}

            {actorError && !actorLoading && (
              <Alert variant="destructive" className="glass shadow-glass">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span className="flex-1">{actorError}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retry}
                    className="shrink-0 glass-subtle"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {profileError && (
              <Alert variant="destructive" className="glass shadow-glass">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load user profile. Please refresh the page.
                </AlertDescription>
              </Alert>
            )}

            {showSuccess && (
              <Alert className="glass shadow-glass bg-green-50/70 dark:bg-green-950/70 border-green-200/50 dark:border-green-800/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Checklist submitted successfully!
                </AlertDescription>
              </Alert>
            )}

            {validationError && (
              <Alert variant="destructive" className="glass shadow-glass">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {createEntry.isError && (
              <Alert variant="destructive" className="glass shadow-glass">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createEntry.error?.message || 'Failed to submit checklist. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter store name"
                disabled={isSubmitDisabled}
                className="glass-subtle"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Checklist Items</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {CHECKLIST_ITEMS.map((itemName) => (
                  <ChecklistItemCard
                    key={itemName}
                    itemName={itemName}
                    photo={photos[itemName]}
                    onPhotoCapture={(file) => handlePhotoCapture(itemName, file)}
                    disabled={isSubmitDisabled}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full shadow-glass"
              size="lg"
            >
              {actorLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : createEntry.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
