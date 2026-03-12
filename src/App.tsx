import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import CalendarPage from "@/pages/CalendarPage";
import MonthPage from "@/pages/MonthPage";
import HistoryPage from "@/pages/HistoryPage";
import PaymentsPage from "@/pages/PaymentsPage";
import SettingsPage from "@/pages/SettingsPage";
import AddPayment from "@/pages/AddPayment";
import PaymentDetail from "@/pages/PaymentDetail";
import CategoriesPage from "@/pages/CategoriesPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Home />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/month" element={<MonthPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="/add-payment" element={<ProtectedRoute><AddPayment /></ProtectedRoute>} />
              <Route path="/payment/:id" element={<ProtectedRoute><PaymentDetail /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
