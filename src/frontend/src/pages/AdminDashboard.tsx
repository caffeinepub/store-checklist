import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Package, Calendar, User, RefreshCw, LogOut } from 'lucide-react';
import { useGetAllEntriesSortedByNewest } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useBackendActor } from '../hooks/useBackendActor';
import { useAdminSession } from '../hooks/useAdminSession';
import { AdminAccessRecovery } from '../components/AdminAccessRecovery';
import type { StoreChecklistEntry } from '../backend';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { actorReady, actorError, actorLoading, retry: retryActor } = useBackendActor();
  const { adminToken, clearToken } = useAdminSession();
  const { data: entries, isLoading, error, refetch } = useGetAllEntriesSortedByNewest();

  // Check for admin session token
  const hasAdminAccess = !!adminToken;

  // Log backend status
  useEffect(() => {
    console.log('[AdminDashboard] Backend status:', { actorReady, actorError, actorLoading });
  }, [actorReady, actorError, actorLoading]);

  // Redirect to login if no identity (for backend calls)
  useEffect(() => {
    if (!identity && hasAdminAccess) {
      console.log('[AdminDashboard] Admin token present but no identity');
    }
  }, [identity, hasAdminAccess]);

  const handleAdminUnlocked = () => {
    // Admin credentials verified, refresh entries
    console.log('[AdminDashboard] Admin unlocked, refetching entries');
    refetch();
  };

  const handleLogout = () => {
    console.log('[AdminDashboard] Logging out admin');
    clearToken();
    navigate({ to: '/' });
  };

  const handleViewDetails = (entryId: string) => {
    navigate({ to: `/admin/submission/${entryId}` });
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and review all checklist submissions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="glass-subtle"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

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

      {!identity && (
        <Alert className="glass shadow-glass mb-6 bg-yellow-50/70 dark:bg-yellow-950/70 border-yellow-200/50 dark:border-yellow-800/50">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            You need to log in with Internet Identity to view backend data.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Alert className="glass shadow-glass">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Loading submissions...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="glass shadow-glass">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="flex-1">
              {error instanceof Error ? error.message : 'Failed to load submissions'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="shrink-0 glass-subtle"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && entries && entries.length === 0 && (
        <Card className="glass-strong shadow-glass-lg">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">No submissions yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Submissions will appear here once users start submitting checklists
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && entries && entries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry: StoreChecklistEntry) => (
            <Card key={entry.id} className="glass-subtle shadow-glass hover:shadow-glass-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{entry.storeName}</CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <User className="h-3 w-3" />
                    <span className="truncate">{entry.submitter.toString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(Number(entry.timestamp) / 1000000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Package className="h-3 w-3" />
                    <span>
                      {entry.items.length} item{entry.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleViewDetails(entry.id)}
                  className="w-full shadow-glass"
                  size="sm"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
