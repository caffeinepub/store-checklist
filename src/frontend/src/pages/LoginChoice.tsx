import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, ClipboardCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminSession } from '../hooks/useAdminSession';
import { getAdminRedirectMessage, clearAdminRedirectMessage } from '../utils/adminSession';

type LoginIntent = 'user' | 'admin' | null;

export default function LoginChoice() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();
  const [loginIntent, setLoginIntent] = useState<LoginIntent>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const { saveAdminSession } = useAdminSession();
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

  // Check for redirect message on mount
  useEffect(() => {
    const message = getAdminRedirectMessage();
    if (message) {
      setRedirectMessage(message);
      clearAdminRedirectMessage();
    }
  }, []);

  // Route user after successful login
  useEffect(() => {
    if (identity && loginIntent === 'user') {
      navigate({ to: '/checklist' });
    }
  }, [identity, loginIntent, navigate]);

  const handleUserLogin = async () => {
    setAuthError(null);
    setLoginIntent('user');
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthError('Login failed. Please try again.');
      setLoginIntent(null);
    }
  };

  const handleAdminClick = () => {
    setAuthError(null);
    setShowAdminForm(true);
    setLoginIntent('admin');
  };

  const handleAdminFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Validate required fields
    if (!adminUserId.trim() || !adminPassword.trim()) {
      setAuthError('Both User ID and Password are required.');
      return;
    }

    // Validate exact credentials
    if (adminUserId !== 'Admin' || adminPassword !== 'Admin') {
      setAuthError('Invalid credentials. Please check your User ID and Password.');
      return;
    }

    // Store credentials in session
    saveAdminSession({ userId: adminUserId, password: adminPassword });

    // Navigate to admin dashboard
    navigate({ to: '/admin' });
  };

  const handleBackToChoice = () => {
    setShowAdminForm(false);
    setLoginIntent(null);
    setAdminUserId('');
    setAdminPassword('');
    setAuthError(null);
  };

  const isLoading = isLoggingIn && loginIntent === 'user';

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/assets/generated/app-logo.dim_512x512.png" 
              alt="Store Checklist Pro" 
              className="w-24 h-24"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Store Checklist Pro</CardTitle>
            <CardDescription className="mt-2">
              {showAdminForm ? 'Enter admin credentials' : 'Choose your login option to continue'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {redirectMessage && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{redirectMessage}</AlertDescription>
            </Alert>
          )}

          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          {!showAdminForm ? (
            <>
              <Button
                onClick={handleUserLogin}
                disabled={isLoading}
                className="w-full h-14 text-base"
                size="lg"
              >
                <ClipboardCheck className="mr-2 h-5 w-5" />
                {isLoading ? 'Logging in...' : 'Login as User'}
              </Button>

              <Button
                onClick={handleAdminClick}
                disabled={isLoading}
                variant="outline"
                className="w-full h-14 text-base"
                size="lg"
              >
                <ShieldCheck className="mr-2 h-5 w-5" />
                Login as Admin
              </Button>
            </>
          ) : (
            <form onSubmit={handleAdminFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminUserId">User ID</Label>
                <Input
                  id="adminUserId"
                  type="text"
                  value={adminUserId}
                  onChange={(e) => setAdminUserId(e.target.value)}
                  placeholder="Enter admin user ID"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToChoice}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
