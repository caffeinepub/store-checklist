import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function AppHeader() {
  const { identity, clear } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  return (
    <header className="glass-strong shadow-glass sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/generated/protect-logo.dim_512x512.png" 
            alt="Protect" 
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Protect
          </h1>
        </div>
        {identity && (
          <Button variant="ghost" size="sm" onClick={handleLogout} className="glass-subtle">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
