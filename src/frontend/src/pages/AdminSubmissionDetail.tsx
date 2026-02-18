import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Calendar, User, Loader2, RefreshCw } from 'lucide-react';
import { useGetEntry } from '../hooks/useQueries';
import { useBackendActor } from '../hooks/useBackendActor';
import { useAdminSession } from '../hooks/useAdminSession';
import { AdminAccessRecovery } from '../components/AdminAccessRecovery';
import type { StoreChecklistEntry } from '../backend';

export default function AdminSubmissionDetail() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { entryId?: string };
  const { adminToken } = useAdminSession();
  const { actorReady, actorError, actorLoading, retry: retryActor } = useBackendActor();
  const getEntry = useGetEntry();
  const [entry, setEntry] = useState<StoreChecklistEntry | null>(null);

  const hasAdminAccess = !!adminToken;
  const entryId = params.entryId;

  // Fetch entry when actor is ready
  useEffect(() => {
    if (actorReady && hasAdminAccess && entryId && !entry) {
      console.log('[AdminSubmissionDetail] Fetching entry:', entryId);
      getEntry.mutate(entryId, {
        onSuccess: (data) => {
          console.log('[AdminSubmissionDetail] Entry fetched:', data);
          setEntry(data);
        },
        onError: (error) => {
          console.error('[AdminSubmissionDetail] Failed to fetch entry:', error);
        },
      });
    }
  }, [actorReady, hasAdminAccess, entryId, entry]);

  const handleAdminUnlocked = () => {
    // Admin credentials verified, retry fetching entry
    console.log('[AdminSubmissionDetail] Admin unlocked, retrying entry fetch');
    if (entryId) {
      getEntry.mutate(entryId, {
        onSuccess: (data) => {
          setEntry(data);
        },
      });
    }
  };

  // Show credential form if no admin token
  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <AdminAccessRecovery
          onAdminUnlocked={handleAdminUnlocked}
          onReturnToLogin={() => navigate({ to: '/' })}
        />
      </div>
    );
  }

  if (!entryId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="glass shadow-glass">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invalid entry ID</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/admin' })}
        className="mb-6 glass-subtle"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {actorLoading && (
        <Alert className="glass shadow-glass mb-6 bg-blue-50/70 dark:bg-blue-950/70 border-blue-200/50 dark:border-blue-800/50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Connecting to backend service...
          </AlertDescription>
        </Alert>
      )}

      {actorError && !actorLoading && (
        <Alert variant="destructive" className="glass shadow-glass mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="flex-1">{actorError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={retryActor}
              className="shrink-0 glass-subtle"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {getEntry.isPending && (
        <Alert className="glass shadow-glass">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading submission details...</AlertDescription>
        </Alert>
      )}

      {getEntry.isError && (
        <Alert variant="destructive" className="glass shadow-glass">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="flex-1">
              {getEntry.error instanceof Error ? getEntry.error.message : 'Failed to load submission'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => entryId && getEntry.mutate(entryId)}
              className="shrink-0 glass-subtle"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!getEntry.isPending && !getEntry.isError && !entry && (
        <Alert className="glass shadow-glass">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Submission not found</AlertDescription>
        </Alert>
      )}

      {entry && (
        <Card className="glass-strong shadow-glass-lg">
          <CardHeader>
            <CardTitle className="text-3xl">{entry.storeName}</CardTitle>
            <CardDescription className="space-y-2 text-base">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-mono text-xs">{entry.submitter.toString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(Number(entry.timestamp) / 1000000).toLocaleString()}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Checklist Items</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                {entry.items.map((item, index) => (
                  <Card key={index} className="glass-subtle shadow-glass">
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {item.photo ? (
                        <div className="aspect-video relative rounded-lg overflow-hidden ring-2 ring-border/50">
                          <img
                            src={item.photo.getDirectURL()}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('[AdminSubmissionDetail] Image load error:', item.name);
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <p className="text-muted-foreground">No photo</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
