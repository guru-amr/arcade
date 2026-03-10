import { Route, Routes, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { PaymentPage } from './pages/PaymentPage';
import { VendorLoginPage } from './pages/VendorLoginPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { StudentLoginPage } from './pages/StudentLoginPage';
import { StudentSignupPage } from './pages/StudentSignupPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <div className="min-h-screen bg-background text-gray-900 font-sans">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student/login" element={<StudentLoginPage />} />
        <Route path="/student/signup" element={<StudentSignupPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/order/pay/:orderId" element={<PaymentPage />} />
        <Route path="/order/confirmation/:orderId" element={<OrderConfirmationPage />} />
        <Route path="/vendor/login" element={<VendorLoginPage />} />
        <Route
          path="/vendor/dashboard"
          element={
            <ProtectedRoute>
              <VendorDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

