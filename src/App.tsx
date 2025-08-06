import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { VoiceTestSuite } from "./components/voice/VoiceTestSuite";
import { VoiceOptimizer } from "./components/performance/VoiceOptimizer";
import { OfflineContentManager } from "./components/offline/OfflineContentManager";
import { MobileBrowserTester } from "./components/performance/MobileBrowserTester";
import VoiceQuality from "./pages/VoiceQuality";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Auth route without layout */}
          <Route path="/auth" element={<Auth />} />
          
          {/* All other routes with sidebar layout and auth guard */}
          <Route path="/*" element={
            <AuthGuard>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/voice-test" element={<VoiceTestSuite />} />
                  <Route path="/voice-quality" element={<VoiceQuality />} />
                  <Route path="/performance" element={
                    <div className="p-6 space-y-6">
                      <VoiceOptimizer />
                      <MobileBrowserTester />
                    </div>
                  } />
                  <Route path="/offline" element={
                    <div className="p-6">
                      <OfflineContentManager />
                    </div>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </AuthGuard>
          } />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
