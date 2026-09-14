import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { RoleRoute } from './auth/RoleRoute';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/shop-owner/OnboardingPage';
import { DashboardPage } from './pages/shop-owner/DashboardPage';
import { BillingPage } from './pages/shop-owner/BillingPage';
import { InventoryPage } from './pages/shop-owner/InventoryPage';
import { LabTestsPage } from './pages/shop-owner/LabTestsPage';
import { LabBookingsPage } from './pages/shop-owner/LabBookingsPage';
import { BrandingPage } from './pages/shop-owner/BrandingPage';
import { PaymentGatewayPage } from './pages/shop-owner/PaymentGatewayPage';
import { PatientHomePage } from './pages/patient/PatientHomePage';
import { BrowsePage } from './pages/patient/BrowsePage';
import { PlaceOrderPage } from './pages/patient/PlaceOrderPage';
import { BookLabTestPage } from './pages/patient/BookLabTestPage';

function HomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === 'FRANCHISE' ? '/shop' : '/patient'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomeRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/onboard"
            element={
              <RoleRoute allow="PATIENT">
                <OnboardingPage />
              </RoleRoute>
            }
          />

          <Route
            path="/shop"
            element={
              <RoleRoute allow="FRANCHISE">
                <DashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/shop/billing"
            element={
              <RoleRoute allow="FRANCHISE">
                <BillingPage />
              </RoleRoute>
            }
          />
          <Route
            path="/shop/inventory"
            element={
              <RoleRoute allow="FRANCHISE">
                <InventoryPage />
              </RoleRoute>
            }
          />
          <Route
            path="/shop/lab-tests"
            element={
              <RoleRoute allow="FRANCHISE">
                <LabTestsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/shop/lab-bookings"
            element={
              <RoleRoute allow="FRANCHISE">
                <LabBookingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/shop/branding"
            element={
              <RoleRoute allow="FRANCHISE">
                <BrandingPage />
              </RoleRoute>
            }
          />
          <Route
            path="/shop/payment-gateway"
            element={
              <RoleRoute allow="FRANCHISE">
                <PaymentGatewayPage />
              </RoleRoute>
            }
          />

          <Route
            path="/patient"
            element={
              <RoleRoute allow="PATIENT">
                <PatientHomePage />
              </RoleRoute>
            }
          />
          <Route
            path="/patient/order-medicine"
            element={
              <RoleRoute allow="PATIENT">
                <BrowsePage />
              </RoleRoute>
            }
          />
          <Route
            path="/patient/order"
            element={
              <RoleRoute allow="PATIENT">
                <PlaceOrderPage />
              </RoleRoute>
            }
          />
          <Route
            path="/patient/lab-tests"
            element={
              <RoleRoute allow="PATIENT">
                <BookLabTestPage />
              </RoleRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
