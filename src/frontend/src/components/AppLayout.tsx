import { ReactNode } from 'react';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
      <footer className="glass-subtle shadow-glass mt-8">
        <div className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
