import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useGetEntry } from '../hooks/useQueries';
import { useBackendActor } from '../hooks/useBackendActor';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAdminSession } from '../hooks/useAdminSession';
import { setAdminRedirectMessage } from '../utils/adminSession';
import { isBackendUnavailableError, isInvalidCredentialsError } from '../utils/backendErrors';

export default function AdminSubmissionDetail() {
  const navigate = useNavigate();
  const { entryId } = useParams({ from: '/admin/submission/$entryId' });
  const { credentials, clearSession } = useAdminSession();
  const { actorReady, actorLoading, actorError, retry: retryActor } = useBackendActor();
  const { data: entry, isLoading: entryLoading, error: entryError, refetch } = useGetEntry(entryId);

  useEffect(() => {
    if (!credentials) {
      setAdminRedirectMessage('Admin login is required to access submission details.');
      navigate({ to: '/' });
    }
  }, [credentials, navigate]);

  // Handle backend errors - only redirect on invalid credentials
  useEffect(() => {
    if (entryError) {
      if (isInvalidCredentialsError(entryError)) {
        clearSession();
        setAdminRedirectMessage('Invalid admin credentials. Please log in again.');
        navigate({ to: '/' });
      }
    }
  }, [entryError, clearSession, navigate]);

  const isLoading = actorLoading || entryLoading;
  const hasError = actorError || entryError;
  const errorMessage = actorError || entryError?.message || 'An error occurred';
  const isBackendUnavailable = hasError && (
    (actorError && isBackendUnavailableError(actorError)) ||
    (entryError && isBackendUnavailableError(entryError))
  );

  const handleRetry = () => {
    if (actorError) {
      retryActor();
    } else {
      refetch();
    }
  };

  if (!credentials || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        {actorLoading && (
          <p className="text-sm text-muted-foreground">Connecting to backend service...</p>
        )}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {typeof errorMessage === 'string' ? errorMessage : 'Failed to load submission details'}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => navigate({ to: '/admin' })} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          {isBackendUnavailable && (
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Submission not found</AlertDescription>
        </Alert>
        <Button onClick={() => navigate({ to: '/admin' })} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/admin' })}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{entry.storeName}</CardTitle>
              <CardDescription className="mt-2">
                Submission ID: {entry.id}
              </CardDescription>
            </div>
            <Badge variant="secondary">{entry.items.length} items</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
              <p className="font-mono text-sm mt-1">{entry.submitter.toString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
              <p className="text-sm mt-1">{formatDate(entry.timestamp)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Checklist Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entry.items.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.photo ? (
                      <img
                        src={item.photo.getDirectURL()}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
