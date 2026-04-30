import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { lazy, ReactNode, Suspense } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Layout from '@/app/components/Layout';

const LoginPage = lazy(() => import('@/app/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/app/pages/RegisterPage'));
const HomePage = lazy(() => import('@/app/pages/HomePage'));
const ServicesPage = lazy(() => import('@/app/pages/ServicesPage'));
const HelpersPage = lazy(() => import('@/app/pages/HelpersPage'));
const AboutPage = lazy(() => import('@/app/pages/AboutPage'));
const CustomerBookingsPage = lazy(() => import('@/app/pages/CustomerBookingsPage'));
const HelperJobsPage = lazy(() => import('@/app/pages/HelperJobsPage'));
const HelperProfilePage = lazy(() => import('@/app/pages/HelperProfilePage'));
const AdminApplicationsPage = lazy(() => import('@/app/pages/AdminApplicationsPage'));
const AdminBookingsPage = lazy(() => import('@/app/pages/AdminBookingsPage'));
const AdminAuditLogsPage = lazy(() => import('@/app/pages/AdminAuditLogsPage'));

function RoutePage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={(
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center text-sm text-gray-600">
          Loading...
        </div>
      )}
    >
      {children}
    </Suspense>
  );
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <RoutePage>
        <Outlet />
      </RoutePage>
    </Layout>
  );
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<'customer' | 'helper' | 'admin'>;
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.userType)) {
    return <Navigate to="/home" replace />;
  }

  return <RoutePage>{children}</RoutePage>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <RoutePage>{children}</RoutePage>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: 'home',
        element: <HomePage />,
      },
      {
        path: 'services',
        element: (
          <RoleRoute allowedRoles={['customer']}>
            <ServicesPage />
          </RoleRoute>
        ),
      },
      {
        path: 'helpers',
        element: (
          <RoleRoute allowedRoles={['customer']}>
            <HelpersPage />
          </RoleRoute>
        ),
      },
      {
        path: 'bookings',
        element: (
          <RoleRoute allowedRoles={['customer']}>
            <CustomerBookingsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'helper/jobs',
        element: (
          <RoleRoute allowedRoles={['helper']}>
            <HelperJobsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'helper/profile',
        element: (
          <RoleRoute allowedRoles={['helper']}>
            <HelperProfilePage />
          </RoleRoute>
        ),
      },
      {
        path: 'admin/applications',
        element: (
          <RoleRoute allowedRoles={['admin']}>
            <AdminApplicationsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'admin/bookings',
        element: (
          <RoleRoute allowedRoles={['admin']}>
            <AdminBookingsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'admin/audit-logs',
        element: (
          <RoleRoute allowedRoles={['admin']}>
            <AdminAuditLogsPage />
          </RoleRoute>
        ),
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
