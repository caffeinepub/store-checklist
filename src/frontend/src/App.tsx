import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import LoginChoice from './pages/LoginChoice';
import UserChecklist from './pages/UserChecklist';
import AdminDashboard from './pages/AdminDashboard';
import AdminSubmissionDetail from './pages/AdminSubmissionDetail';
import AppLayout from './components/AppLayout';

// Root layout component
function RootLayout() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Clear cache when identity changes (logout)
  useEffect(() => {
    if (!identity) {
      queryClient.clear();
      navigate({ to: '/' });
    }
  }, [identity, queryClient, navigate]);

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout
});

// Login choice route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginChoice
});

// User checklist route
const userChecklistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checklist',
  component: UserChecklist
});

// Admin dashboard route
const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard
});

// Admin submission detail route
const adminSubmissionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/submission/$entryId',
  component: AdminSubmissionDetail
});

// Create router
const routeTree = rootRoute.addChildren([
  indexRoute,
  userChecklistRoute,
  adminDashboardRoute,
  adminSubmissionDetailRoute
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
