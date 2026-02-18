import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertCircle, CalendarIcon, Loader2, RefreshCw, X } from 'lucide-react';
import { useGetAllEntriesSortedByNewest } from '../hooks/useQueries';
import { useAdminSession } from '../hooks/useAdminSession';
import { useBackendActor } from '../hooks/useBackendActor';
import { isInvalidCredentialsError } from '../utils/backendErrors';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { credentials, clearSession } = useAdminSession();
  const { actorReady, actorLoading, actorError, retry } = useBackendActor();
  const { data: entries, isLoading: entriesLoading, error: entriesError, refetch } = useGetAllEntriesSortedByNewest();

  const [storeFilter, setStoreFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Log query errors for debugging
  useEffect(() => {
    if (entriesError) {
      console.error('Entries query error:', {
        message: entriesError.message,
        originalError: (entriesError as any).originalError,
      });
    }
  }, [entriesError]);

  useEffect(() => {
    if (!credentials) {
      navigate({ to: '/', search: { redirect: 'Session expired. Please log in again.' } });
      return;
    }

    // Check for invalid credentials error
    if (entriesError && isInvalidCredentialsError(entriesError)) {
      clearSession();
      navigate({ to: '/', search: { redirect: 'Invalid credentials. Please log in again.' } });
    }
  }, [credentials, entriesError, navigate, clearSession]);

  const handleRetry = async () => {
    if (actorError) {
      // If actor failed, retry actor initialization
      await retry();
    } else if (entriesError) {
      // If query failed, refetch the query
      await refetch();
    }
  };

  const filteredEntries = entries?.filter(entry => {
    const matchesStore = !storeFilter || 
      entry.storeName.toLowerCase().includes(storeFilter.toLowerCase());
    
    const matchesDate = !dateFilter || 
      format(new Date(Number(entry.timestamp) / 1000000), 'yyyy-MM-dd') === 
      format(dateFilter, 'yyyy-MM-dd');
    
    return matchesStore && matchesDate;
  }) || [];

  const clearFilters = () => {
    setStoreFilter('');
    setDateFilter(undefined);
  };

  const hasActiveFilters = storeFilter || dateFilter;
  const isLoading = actorLoading || entriesLoading;
  const hasError = !!(actorError || entriesError);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <Card className="glass-strong shadow-glass-lg border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <CardDescription>
            View and manage all store checklist submissions
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

          {entriesError && !actorError && (
            <Alert variant="destructive" className="glass shadow-glass">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="flex-1">{entriesError.message}</span>
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

          <div className="glass-subtle rounded-lg p-4 shadow-glass">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="storeFilter">Filter by Store Name</Label>
                <Input
                  id="storeFilter"
                  placeholder="Enter store name..."
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  disabled={isLoading || hasError}
                  className="glass-subtle"
                />
              </div>

              <div className="space-y-2">
                <Label>Filter by Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal glass-subtle',
                        !dateFilter && 'text-muted-foreground'
                      )}
                      disabled={isLoading || hasError}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-strong" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters || isLoading || hasError}
                  className="w-full glass-subtle"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {hasActiveFilters && !isLoading && !hasError && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredEntries.length} of {entries?.length || 0} submissions
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hasError ? (
            <div className="text-center py-12 text-muted-foreground">
              Unable to load submissions. Please retry.
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {hasActiveFilters ? 'No submissions match your filters' : 'No submissions yet'}
            </div>
          ) : (
            <div className="glass-subtle rounded-lg overflow-hidden shadow-glass">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Store Name</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-border/50">
                      <TableCell className="font-medium">{entry.storeName}</TableCell>
                      <TableCell>
                        {format(new Date(Number(entry.timestamp) / 1000000), 'PPP p')}
                      </TableCell>
                      <TableCell>{entry.items.length} items</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate({ to: '/admin/submission/$entryId', params: { entryId: entry.id } })}
                          className="glass-subtle"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
