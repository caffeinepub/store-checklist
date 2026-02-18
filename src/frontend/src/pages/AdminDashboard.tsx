import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, Loader2, RefreshCw, X } from 'lucide-react';
import { useGetAllEntriesSortedByNewest } from '../hooks/useQueries';
import { useBackendActor } from '../hooks/useBackendActor';
import { Badge } from '@/components/ui/badge';
import { useAdminSession } from '../hooks/useAdminSession';
import { setAdminRedirectMessage } from '../utils/adminSession';
import { isBackendUnavailableError, isUnauthorizedError } from '../utils/backendErrors';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { credentials, clearSession } = useAdminSession();
  const { actorReady, actorLoading, actorError, retry: retryActor } = useBackendActor();
  const { data: entries, isLoading: entriesLoading, error: entriesError, refetch } = useGetAllEntriesSortedByNewest();

  // Filter state
  const [storeNameFilter, setStoreNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Redirect if no admin session - but wait for actor to be ready first
  useEffect(() => {
    if (!actorLoading && !credentials) {
      setAdminRedirectMessage('Admin login is required to access the dashboard.');
      navigate({ to: '/' });
    }
  }, [credentials, navigate, actorLoading]);

  // Handle unauthorized errors - clear session and redirect
  useEffect(() => {
    if (entriesError && isUnauthorizedError(entriesError)) {
      clearSession();
      setAdminRedirectMessage('Admin access required. Please log in with valid admin credentials.');
      navigate({ to: '/' });
    }
  }, [entriesError, clearSession, navigate]);

  // Client-side filtering
  const filteredEntries = useMemo(() => {
    if (!entries) return [];

    return entries.filter((entry) => {
      // Store name filter (case-insensitive)
      if (storeNameFilter && !entry.storeName.toLowerCase().includes(storeNameFilter.toLowerCase())) {
        return false;
      }

      // Date filter (match calendar date in local time)
      if (dateFilter) {
        const entryDate = new Date(Number(entry.timestamp) / 1_000_000);
        const entryDateString = entryDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
        if (entryDateString !== dateFilter) {
          return false;
        }
      }

      return true;
    });
  }, [entries, storeNameFilter, dateFilter]);

  const clearFilters = () => {
    setStoreNameFilter('');
    setDateFilter('');
  };

  const hasActiveFilters = storeNameFilter || dateFilter;

  // Show loading while actor initializes or credentials are being checked
  if (actorLoading || !credentials) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString();
  };

  const formatPrincipal = (principal: string) => {
    if (principal.length <= 16) return principal;
    return `${principal.slice(0, 8)}...${principal.slice(-8)}`;
  };

  const hasError = actorError || entriesError;
  const errorMessage = actorError || entriesError?.message || 'An error occurred';
  const isBackendUnavailable = hasError && (
    (actorError && isBackendUnavailableError(actorError)) ||
    (entriesError && isBackendUnavailableError(entriesError))
  );
  const isLoading = entriesLoading;

  const handleRetry = () => {
    if (actorError) {
      retryActor();
    } else {
      refetch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <CardDescription>
            View all checklist submissions from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !entries && (
            <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Loading submissions...
              </AlertDescription>
            </Alert>
          )}

          {hasError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{typeof errorMessage === 'string' ? errorMessage : 'Failed to load submissions'}</span>
                {isBackendUnavailable && (
                  <Button onClick={handleRetry} size="sm" variant="outline" className="ml-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!hasError && entries && (
            <>
              {/* Filters */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeFilter" className="text-xs">Store Name</Label>
                    <Input
                      id="storeFilter"
                      placeholder="Filter by store name..."
                      value={storeNameFilter}
                      onChange={(e) => setStoreNameFilter(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFilter" className="text-xs">Date</Label>
                    <Input
                      id="dateFilter"
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Showing {filteredEntries.length} of {entries.length} submissions
                  </p>
                )}
              </div>

              {/* Results */}
              {filteredEntries.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {hasActiveFilters ? 'No submissions match your filters.' : 'No submissions yet.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.storeName}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatPrincipal(entry.submitter.toString())}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(entry.timestamp)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{entry.items.length}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate({ to: '/admin/submission/$entryId', params: { entryId: entry.id } })}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
