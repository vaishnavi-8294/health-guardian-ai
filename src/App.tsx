import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import AwarenessPage from "./pages/AwarenessPage.tsx";
import DiseaseReportForm from "./pages/DiseaseReportForm.tsx";
import MyReportsPage from "./pages/MyReportsPage.tsx";
import AllReportsPage from "./pages/AllReportsPage.tsx";
import AlertsPage from "./pages/AlertsPage.tsx";
import PredictionsPage from "./pages/PredictionsPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Index />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/awareness" element={<AwarenessPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['asha_worker']} />}>
              <Route path="/report" element={<DiseaseReportForm />} />
              <Route path="/my-reports" element={<MyReportsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['health_authority']} />}>
              <Route path="/all-reports" element={<AllReportsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
