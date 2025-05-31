// src/routes/sections.tsx

import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { varAlpha } from 'src/theme/styles';
import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

import { useAuth } from 'src/context/AuthContext';

// ----------------------------------------------------------------------

// Lazy-loaded pages
export const HomePage = lazy(() => import('src/pages/home'));


export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const SignUpPage = lazy(() => import('src/pages/sign-up'));
export const RidesPage = lazy(() => import('src/pages/rides'));
export const TripDetailsPage = lazy(() => import('src/pages/tripDetails'));
export const PostRidePage = lazy(() => import('src/pages/postRides'));
export const ProfilePage = lazy(() => import('src/pages/profile'));
export const YourRides = lazy(() => import('src/pages/yourRides'));
export const ChatPage = lazy(() => import('src/pages/chat'));




export const Page404 = lazy(() => import('src/pages/page-not-found'));

export const OAuthCallbackPage = lazy(() => import('src/pages/oauth-callback')); // New Page

// ----------------------------------------------------------------------

// Fallback component during lazy loading
const renderFallback = (
  <Box display="flex" alignItems="center" justifyContent="center" flex="1 1 auto">
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return renderFallback;
  }

  return user ? children : <Navigate to="/sign-in" replace />;
};

// PublicRoute component to restrict access to authenticated users
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return renderFallback;
  }

  return !user ? children : <Navigate to="/" replace />;
};

export function Router() {
  return useRoutes([
    {
      element: (
        <PrivateRoute>
          <DashboardLayout>
            <Suspense fallback={renderFallback}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </PrivateRoute>
      ),
      children: [
        { element: <HomePage />, index: true },
       
       
        
        { path: 'rides', element: <RidesPage /> },
        { path: 'rides/:id', element: <TripDetailsPage /> },
        { path: 'post-ride', element: <PostRidePage /> },
       
        { path: 'profile', element: <ProfilePage /> },
        { path: 'your-rides', element: <YourRides /> },
        

        
        // Existing Chat Route
        { path: 'chat', element: <ChatPage /> },
        
        // **New Dynamic Chat Route**
        { path: 'chat/:conversationId', element: <ChatPage /> },
      ],
    },
    {
      path: 'sign-in',
      element: (
        <PublicRoute>
          <AuthLayout>
            <SignInPage />
          </AuthLayout>
        </PublicRoute>
      ),
    },
    {
      path: 'sign-up',
      element: (
        <PublicRoute>
          <AuthLayout>
            <SignUpPage />
          </AuthLayout>
        </PublicRoute>
      ),
    },
    {
      path: 'oauth/callback', // New Route
      element: (
        <PublicRoute>
          <OAuthCallbackPage />
        </PublicRoute>
      ),
    },
    {
      path: '404',
      element: <Page404 />,
    },
    // **Catch-All Route for Undefined Paths**
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);
}
