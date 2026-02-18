import { useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useGetEntry } from '../hooks/useQueries';
import { useAdminSession } from '../hooks/useAdminSession';
import { useBackendActor } from '../hooks/useBackendActor';
import { isInvalidCredentialsError } from '../utils/backendErrors';
import { format } from 'date-fns';
import { ExternalBlob } from '../backend';

export default function AdminSubmissionDetail() {
  const navigate = useNavigate();
  const { entryId } = useParams({ strict: false }) as { entryId: string };
  const { credentials, clearSession } = useAdminSession();
  const { actorReady, actorLoading, actorError, retry } = useBackendActor();
  const { data: entry, isLoading: entryLoading, error: entryError, refetch } = useGetEntry(entryId);

  // Log query errors for debugging
  useEffect(() => {
    if (entryError) {
      console.error('Entry query error:', {
        message: entryError.message,
        originalError: (entryError as any).originalError,
      });
    }
  }, [entryError]);

  useEffect(() => {
    if (!credentials) {
      navigate({ to: '/', search: { redirect: 'Session expired. Please log in again.' } });
      return;
    }

    // Check for invalid credentials error
    if (entryError && isInvalidCredentialsError(entryError)) {
      clearSession();
      navigate({ to: '/', search: { redirect: 'Invalid credentials. Please log in again.' } });
    }
  }, [credentials, entryError, navigate, clearSession]);

  const handleRetry = async () => {
    if (actorError) {
      // If actor failed, retry actor initialization
      await retry();
    } else if (entryError) {
      // If query failed, refetch the query
      await refetch();
    }
  };

  const isLoading = actorLoading || entryLoading;
  const hasError = !!(actorError || entryError);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/admin' })}
          className="glass-subtle shadow-glass"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="glass-strong shadow-glass-lg border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Submission Details</CardTitle>
          <CardDescription>
            View detailed information about this checklist submission
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
                  onClick={handleRetry}
                  className="shrink-0 glass-subtle"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {entryError && !actorError && (
            <Alert variant="destructive" className="glass shadow-glass">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="flex-1">{entryError.message}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="shrink-0 glass-subtle"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasError ? (
            <div className="text-center py-12 text-muted-foreground">
              Unable to load submission details. Please retry.
            </div>
          ) : !entry ? (
            <div className="text-center py-12 text-muted-foreground">
              Submission not found
            </div>
          ) : (
            <>
              <div className="glass-subtle rounded-lg p-6 space-y-4 shadow-glass">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Store Name</h3>
                  <p className="text-lg font-semibold mt-1">{entry.storeName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Submission Date</h3>
                  <p className="text-lg mt-1">
                    {format(new Date(Number(entry.timestamp) / 1000000), 'PPP p')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Submitter</h3>
                  <p className="text-sm font-mono mt-1 break-all">{entry.submitter.toString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Checklist Items</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {entry.items.map((item, index) => (
                    <Card key={index} className="glass-subtle shadow-glass">
                      <CardHeader>
                        <CardTitle className="text-base">{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {item.photo ? (
                          <div className="aspect-video relative rounded-lg overflow-hidden ring-1 ring-border/50">
                            <img
                              src={(item.photo as ExternalBlob).getDirectURL()}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center bg-muted/50 rounded-lg ring-1 ring-border/50">
                            <p className="text-sm text-muted-foreground">No photo</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
