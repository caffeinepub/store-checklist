import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Shield, LogIn, CheckCircle } from 'lucide-react';
import { useAdminSession } from '../hooks/useAdminSession';

interface AdminAccessRecoveryProps {
  onAdminUnlocked?: () => void;
  onSwitchToUserMode?: () => void;
  onReturnToLogin?: () => void;
}

/**
 * Admin credential login form that validates Admin/Admin credentials locally
 * and grants immediate dashboard access without backend verification.
 */
export function AdminAccessRecovery({ onAdminUnlocked, onSwitchToUserMode, onReturnToLogin }: AdminAccessRecoveryProps) {
  const { saveAdminToken } = useAdminSession();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      setIsSubmitting(false);
      return;
    }

    // Simulate brief processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate credentials locally (case-sensitive)
    if (username === 'Admin' && password === 'Admin') {
      // Save admin session token
      const adminToken = `admin_${Date.now()}`;
      saveAdminToken(adminToken);
      
      setSuccess('Admin access granted! Redirecting...');
      setUsername('');
      setPassword('');
      
      // Navigate after brief delay
      setTimeout(() => {
        setIsSubmitting(false);
        if (onAdminUnlocked) {
          onAdminUnlocked();
        }
      }, 1000);
    } else {
      setError('Invalid credentials. Please use Username: Admin and Password: Admin (case-sensitive).');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-strong shadow-glass-lg border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5 text-destructive" />
          Admin Access Required
        </CardTitle>
        <CardDescription className="text-base">
          Enter admin credentials to unlock full access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Admin Credential Form */}
        <form onSubmit={handleCredentialSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              User ID
            </Label>
            <Input
              id="admin-username"
              type="text"
              placeholder="Enter admin user ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className="glass-subtle"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="glass-subtle"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full shadow-glass"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Login as Admin
              </>
            )}
          </Button>
        </form>

        {/* Status Messages */}
        {success && (
          <Alert className="glass shadow-glass bg-green-50/70 dark:bg-green-950/70 border-green-200/50 dark:border-green-800/50">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="glass shadow-glass">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Alternative Actions */}
        {(onSwitchToUserMode || onReturnToLogin) && (
          <div className="pt-4 border-t border-border/50 space-y-2">
            <p className="text-sm font-medium">Alternative Options:</p>
            
            {onSwitchToUserMode && (
              <Button
                variant="outline"
                onClick={onSwitchToUserMode}
                disabled={isSubmitting}
                className="w-full glass-subtle"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Switch to User Mode
              </Button>
            )}

            {onReturnToLogin && (
              <Button
                variant="outline"
                onClick={onReturnToLogin}
                disabled={isSubmitting}
                className="w-full glass-subtle"
              >
                Back to Login
              </Button>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Default credentials:</strong> User ID: <code className="px-1 py-0.5 bg-muted rounded">Admin</code>, Password: <code className="px-1 py-0.5 bg-muted rounded">Admin</code>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Credentials are case-sensitive. Make sure to enter them exactly as shown.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
