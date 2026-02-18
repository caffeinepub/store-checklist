import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, User, Shield, RefreshCw } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useBackendActor } from '../hooks/useBackendActor';
import { AdminAccessRecovery } from '../components/AdminAccessRecovery';

export default function LoginChoice() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const { login, identity, loginStatus } = useInternetIdentity();
  const { actorError, actorLoading, retry } = useBackendActor();

  const [showAdminRecovery, setShowAdminRecovery] = useState(false);

  // Check backend connection on mount
  useEffect(() => {
    console.log('[LoginChoice] Backend status:', { actorError, actorLoading });
  }, [actorError, actorLoading]);

  const handleUserLogin = async () => {
    try {
      // If already logged in, just navigate
      if (identity) {
        navigate({ to: '/checklist' });
        return;
      }
      
      await login();
      // After successful login, navigate to checklist
      navigate({ to: '/checklist' });
    } catch (error: any) {
      console.error('[LoginChoice] Login error:', error);
    }
  };

  const handleAdminClick = () => {
    // Immediately show the admin credential popup without any checks
    setShowAdminRecovery(true);
  };

  const handleAdminUnlocked = () => {
    // Navigate to admin dashboard after successful credential entry
    navigate({ to: '/admin' });
  };

  const handleBackToLogin = () => {
    setShowAdminRecovery(false);
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {search.redirect && (
          <Alert className="glass shadow-glass">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{search.redirect}</AlertDescription>
          </Alert>
        )}

        {/* Backend connection error */}
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

        {/* Backend connecting */}
        {actorLoading && (
          <Alert className="glass shadow-glass bg-blue-50/70 dark:bg-blue-950/70 border-blue-200/50 dark:border-blue-800/50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Connecting to backend service...
            </AlertDescription>
          </Alert>
        )}

        {/* Show admin recovery UI when admin card is clicked */}
        {showAdminRecovery ? (
          <AdminAccessRecovery
            onAdminUnlocked={handleAdminUnlocked}
            onReturnToLogin={handleBackToLogin}
          />
        ) : (
          /* Show login choice */
          <Card className="glass-strong shadow-glass-lg">
            <CardHeader>
              <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome to Protect
              </CardTitle>
              <CardDescription className="text-base">
                Choose how you'd like to access the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleUserLogin}
                disabled={isLoggingIn}
                className="w-full h-14 text-lg shadow-glass"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-5 w-5" />
                    {identity ? 'Continue as User' : 'Login as User'}
                  </>
                )}
              </Button>

              <Button
                onClick={handleAdminClick}
                variant="outline"
                className="w-full h-14 text-lg glass-subtle"
                size="lg"
              >
                <Shield className="mr-2 h-5 w-5" />
                Login as Admin
              </Button>

              <p className="text-sm text-muted-foreground text-center pt-4">
                Secure authentication powered by Internet Identity
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
