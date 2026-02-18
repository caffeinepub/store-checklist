import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, RefreshCw, User, Shield } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useBackendActor } from '../hooks/useBackendActor';
import { useAdminAuthorization } from '../hooks/useAdminAuthorization';

export default function LoginChoice() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string; adminMode?: string };
  const { login, identity, loginStatus } = useInternetIdentity();
  const { actorReady, actorLoading, actorError, retry } = useBackendActor();
  const { isAdmin, isCheckingAdmin } = useAdminAuthorization();

  const [isAdminMode, setIsAdminMode] = useState(search.adminMode === 'true');

  // Redirect authenticated users based on their role
  useEffect(() => {
    if (identity && actorReady && !isCheckingAdmin) {
      if (isAdminMode && isAdmin) {
        navigate({ to: '/admin' });
      } else if (!isAdminMode) {
        navigate({ to: '/checklist' });
      }
      // If admin mode but not admin, stay on login page to show error
    }
  }, [identity, actorReady, isCheckingAdmin, isAdmin, isAdminMode, navigate]);

  const handleUserLogin = async () => {
    setIsAdminMode(false);
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleAdminLogin = async () => {
    setIsAdminMode(true);
    try {
      await login();
    } catch (error: any) {
      console.error('Admin login error:', error);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';
  const isConnecting = actorLoading || (identity && !actorReady);
  const showAdminError = identity && actorReady && !isCheckingAdmin && isAdminMode && !isAdmin;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {search.redirect && (
          <Alert className="glass shadow-glass">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{search.redirect}</AlertDescription>
          </Alert>
        )}

        {actorLoading && (
          <Alert className="glass shadow-glass bg-blue-50/70 dark:bg-blue-950/70 border-blue-200/50 dark:border-blue-800/50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Connecting to backend service...
            </AlertDescription>
          </Alert>
        )}

        {isCheckingAdmin && (
          <Alert className="glass shadow-glass bg-blue-50/70 dark:bg-blue-950/70 border-blue-200/50 dark:border-blue-800/50">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Verifying admin access...
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

        {showAdminError && (
          <Alert variant="destructive" className="glass shadow-glass">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your account does not have admin privileges. Please contact an administrator to request access.
            </AlertDescription>
          </Alert>
        )}

        <Card className="glass-strong shadow-glass-lg border-2">
          <CardHeader className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <img 
                src="/assets/generated/protect-logo.dim_512x512.png" 
                alt="Protect" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Protect
            </CardTitle>
            <CardDescription className="text-base">
              Choose how you want to access the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleUserLogin}
              disabled={isLoggingIn || isConnecting || !!actorError}
              className="w-full shadow-glass"
              size="lg"
            >
              {isLoggingIn && !isAdminMode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Login as User
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="glass-subtle px-3 py-1 rounded-full text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              onClick={handleAdminLogin}
              variant="outline"
              disabled={isLoggingIn || isConnecting || !!actorError}
              className="w-full glass-subtle shadow-glass"
              size="lg"
            >
              {isLoggingIn && isAdminMode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Login as Admin
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
