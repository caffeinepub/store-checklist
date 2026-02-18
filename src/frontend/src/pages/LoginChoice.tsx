import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, RefreshCw, User, Shield } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminSession } from '../hooks/useAdminSession';
import { useBackendActor } from '../hooks/useBackendActor';

export default function LoginChoice() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const { login, identity, loginStatus } = useInternetIdentity();
  const { saveAdminSession } = useAdminSession();
  const { actorReady, actorLoading, actorError, retry } = useBackendActor();

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Redirect authenticated users
  useEffect(() => {
    if (identity && actorReady) {
      navigate({ to: '/checklist' });
    }
  }, [identity, actorReady, navigate]);

  const handleUserLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleAdminLogin = () => {
    setAdminError(null);

    if (!adminUserId.trim() || !adminPassword.trim()) {
      setAdminError('Please enter both User ID and Password');
      return;
    }

    if (adminUserId !== 'Admin' || adminPassword !== 'Admin') {
      setAdminError('Invalid admin credentials');
      return;
    }

    saveAdminSession({ userId: adminUserId, password: adminPassword });
    navigate({ to: '/admin' });
  };

  const isLoggingIn = loginStatus === 'logging-in';
  const isConnecting = actorLoading || (identity && !actorReady);

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
            {!showAdminForm ? (
              <>
                <Button
                  onClick={handleUserLogin}
                  disabled={isLoggingIn || isConnecting || !!actorError}
                  className="w-full shadow-glass"
                  size="lg"
                >
                  {isLoggingIn ? (
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
                  onClick={() => setShowAdminForm(true)}
                  variant="outline"
                  disabled={isConnecting || !!actorError}
                  className="w-full glass-subtle shadow-glass"
                  size="lg"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Login as Admin
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminUserId">Admin User ID</Label>
                    <Input
                      id="adminUserId"
                      type="text"
                      value={adminUserId}
                      onChange={(e) => setAdminUserId(e.target.value)}
                      placeholder="Enter admin user ID"
                      disabled={isConnecting || !!actorError}
                      className="glass-subtle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      disabled={isConnecting || !!actorError}
                      className="glass-subtle"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAdminLogin();
                        }
                      }}
                    />
                  </div>

                  {adminError && (
                    <Alert variant="destructive" className="glass shadow-glass">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{adminError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAdminLogin}
                      disabled={isConnecting || !!actorError}
                      className="flex-1 shadow-glass"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAdminForm(false);
                        setAdminUserId('');
                        setAdminPassword('');
                        setAdminError(null);
                      }}
                      variant="outline"
                      disabled={isConnecting}
                      className="glass-subtle"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
