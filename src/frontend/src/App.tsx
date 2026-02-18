import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet, ErrorComponent } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/AppLayout';
import LoginChoice from './pages/LoginChoice';
import UserChecklist from './pages/UserChecklist';
import AdminDashboard from './pages/AdminDashboard';
import AdminSubmissionDetail from './pages/AdminSubmissionDetail';
import { useInternetIdentity } from './hooks/useInternetIdentity';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
    mutations: {
      retry: 1,
    },
  },
});

function RootLayout() {
  const { identity } = useInternetIdentity();

  // Clear query cache when identity changes (logout)
  const currentPrincipal = identity?.getPrincipal().toString();
  
  if (!currentPrincipal) {
    // Only clear if we had a principal before
    const hadPrincipal = queryClient.getQueryData(['actor']);
    if (hadPrincipal) {
      console.log('[App] Identity cleared, clearing query cache');
      queryClient.clear();
    }
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: ({ error }) => {
    console.error('[App] Route error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorComponent error={error} />
        </div>
      </div>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginChoice,
});

const checklistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checklist',
  component: UserChecklist,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard,
});

const adminSubmissionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/submission/$entryId',
  component: AdminSubmissionDetail,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  checklistRoute,
  adminRoute,
  adminSubmissionRoute,
]);

const router = createRouter({ 
  routeTree,
  defaultErrorComponent: ({ error }) => {
    console.error('[Router] Error:', error);
    return <ErrorComponent error={error} />;
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
