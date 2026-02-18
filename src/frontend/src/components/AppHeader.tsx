import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { clearAdminSession, clearAdminRedirectMessage } from '../utils/adminSession';

export default function AppHeader() {
  const { identity, clear } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    clearAdminSession();
    clearAdminRedirectMessage();
    navigate({ to: '/' });
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/generated/app-logo.dim_512x512.png" 
            alt="Store Checklist Pro" 
            className="w-10 h-10"
          />
          <h1 className="text-xl font-bold">Store Checklist Pro</h1>
        </div>
        {identity && (
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
