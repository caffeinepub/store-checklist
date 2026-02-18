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
import { isBackendUnavailableError, isInvalidCredentialsError } from '../utils/backendErrors';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { credentials, clearSession } = useAdminSession();
  const { actorReady, actorLoading, actorError, retry: retryActor } = useBackendActor();
  const { data: entries, isLoading: entriesLoading, error: entriesError, refetch } = useGetAllEntriesSortedByNewest();

  // Filter state
  const [storeNameFilter, setStoreNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!credentials) {
      setAdminRedirectMessage('Admin login is required to access the dashboard.');
      navigate({ to: '/' });
    }
  }, [credentials, navigate]);

  // Handle backend errors - only redirect on invalid credentials
  useEffect(() => {
    if (entriesError) {
      if (isInvalidCredentialsError(entriesError)) {
        clearSession();
        setAdminRedirectMessage('Invalid admin credentials. Please log in again.');
        navigate({ to: '/' });
      }
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

  if (!credentials) {
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
  const isLoading = actorLoading || entriesLoading;

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
          {actorLoading && (
            <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Connecting to backend service...
              </AlertDescription>
            </Alert>
          )}

          {hasError && !actorLoading && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{typeof errorMessage === 'string' ? errorMessage : 'Failed to load submissions'}</span>
                {isBackendUnavailable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Filter Controls */}
          {!isLoading && entries && entries.length > 0 && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="store-name-filter" className="text-sm font-medium mb-2 block">
                    Store Name
                  </Label>
                  <Input
                    id="store-name-filter"
                    type="text"
                    placeholder="Filter by store name..."
                    value={storeNameFilter}
                    onChange={(e) => setStoreNameFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="date-filter" className="text-sm font-medium mb-2 block">
                    Date
                  </Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="whitespace-nowrap"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
              {hasActiveFilters && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Showing {filteredEntries.length} of {entries.length} submissions
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries && entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No submissions yet
            </div>
          ) : filteredEntries.length === 0 && hasActiveFilters ? (
            <div className="text-center py-12 text-muted-foreground">
              No submissions match the current filters
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.storeName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatPrincipal(entry.submitter.toString())}
                      </TableCell>
                      <TableCell>{formatDate(entry.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.items.length} items</Badge>
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
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
