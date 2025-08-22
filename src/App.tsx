import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminTest = lazy(() => import("./pages/AdminTest"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const VoiceQuality = lazy(() => import("./pages/VoiceQuality"));

// Lazy load heavy components
const VoiceTestSuite = lazy(() => import("./components/voice/VoiceTestSuite").then(m => ({ default: m.VoiceTestSuite })));
const VoiceOptimizer = lazy(() => import("./components/performance/VoiceOptimizer").then(m => ({ default: m.VoiceOptimizer })));
const OfflineContentManager = lazy(() => import("./components/offline/OfflineContentManager").then(m => ({ default: m.OfflineContentManager })));
const MobileBrowserTester = lazy(() => import("./components/performance/MobileBrowserTester").then(m => ({ default: m.MobileBrowserTester })));
import { ConversationsProvider } from "./contexts/ConversationsContext";
import { VoiceModeProvider } from "./contexts/VoiceModeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import './i18n';

const queryClient = new QueryClient();

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const ProtectedLayout = () => (
  <AuthGuard>
    <LanguageProvider>
      <ConversationsProvider>
        <VoiceModeProvider>
          <ErrorBoundary>
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </AppLayout>
          </ErrorBoundary>
        </VoiceModeProvider>
      </ConversationsProvider>
    </LanguageProvider>
  </AuthGuard>
);

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Suspense fallback={<PageLoader />}><Auth /></Suspense>
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: "home", element: <Home /> },
      { path: "chat", element: <Chat /> },
      { path: "profile", element: <Profile /> },
      { path: "bookmarks", element: <Bookmarks /> },
      { path: "settings", element: <Settings /> },
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/test", element: <AdminTest /> },
      { path: "voice-test", element: <VoiceTestSuite /> },
      { path: "voice-quality", element: <VoiceQuality /> },
      { path: "privacy", element: <Privacy /> },
      { path: "terms", element: <Terms /> },
      { 
        path: "performance", 
        element: (
          <Suspense fallback={<PageLoader />}>
            <div className="p-6 space-y-6">
              <VoiceOptimizer />
              <MobileBrowserTester />
            </div>
          </Suspense>
        )
      },
      { 
        path: "offline", 
        element: (
          <Suspense fallback={<PageLoader />}>
            <div className="p-6">
              <OfflineContentManager />
            </div>
          </Suspense>
        )
      },
      { path: "*", element: <NotFound /> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
