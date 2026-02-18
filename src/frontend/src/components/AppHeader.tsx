import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export default function AppHeader() {
  const navigate = useNavigate();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      console.log('[AppHeader] Logging out...');
      
      // Clear all cached data including admin authorization
      queryClient.clear();
      
      // Clear Internet Identity
      await clear();
      
      console.log('[AppHeader] Logout complete');
      
      // Navigate to login
      navigate({ to: '/' });
    } catch (error) {
      console.error('[AppHeader] Logout error:', error);
      // Still navigate even if there's an error
      navigate({ to: '/' });
    }
  };

  return (
    <header className="glass-strong border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/generated/protect-logo.dim_512x512.png" 
            alt="Protect" 
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Protect
          </h1>
        </div>
        
        {identity && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="glass-subtle"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
