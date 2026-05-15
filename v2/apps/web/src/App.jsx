import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ProductListPage from "./pages/ProductListPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import CartPage from "./pages/CartPage";
import ProfilePage from "./pages/ProfilePage";
import CartStrip from "./components/CartStrip";
import AiAssistant from "./components/AiAssistant";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/order/tracking/:orderId" element={<OrderTrackingPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CartStrip />
      <AiAssistant />
    </>
  );
}
