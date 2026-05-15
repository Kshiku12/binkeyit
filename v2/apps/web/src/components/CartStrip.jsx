import { useCart } from "../state/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function CartStrip() {
  const { totalItems, cartTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("v2_access_token"));
  const [hideStrip, setHideStrip] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [secondsRemaining, setSecondsRemaining] = useState({}); // Map of id -> seconds
  const [mode, setMode] = useState("CART"); // "CART", or orderId

  useEffect(() => {
    if (totalItems > 0) {
      if (mode === "CART") return;
      setMode("CART");
    } else if (activeOrders.length > 0 && mode === "CART") {
      setMode(activeOrders[0]._id);
    }
  }, [totalItems, activeOrders.length]);

  const fetchActiveOrder = async () => {
    const token = localStorage.getItem("v2_access_token");
    if (!token) return;
    try {
      const res = await api.get("/api/v2/orders/mine");
      const orders = res.data.data || [];
      const active = orders.filter(o => {
        const isRated = localStorage.getItem(`rated_${o._id}`);
        return !isRated && ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(o.orderStatus);
      });
      setActiveOrders(active);
      
      // If current mode is an order that is no longer active, switch back
      if (mode !== "CART" && !active.find(o => o._id === mode)) {
        if (totalItems > 0) setMode("CART");
        else if (active.length > 0) setMode(active[0]._id);
        else setMode("CART");
      }
    } catch (err) {
      console.error("Error fetching active orders", err);
    }
  };

  useEffect(() => {
    fetchActiveOrder();
    
    const handleAuthChange = () => {
      const loggedIn = !!localStorage.getItem("v2_access_token");
      setIsLoggedIn(loggedIn);
      if (loggedIn) fetchActiveOrder();
      else setActiveOrders([]);
    };

    const handleCartChange = () => {
      fetchActiveOrder();
    };

    window.addEventListener("auth_change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("cart_change", handleCartChange);

    return () => {
      window.removeEventListener("auth_change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("cart_change", handleCartChange);
    };
  }, []);

  useEffect(() => {
    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newSeconds = {};
      let anyZero = false;

      activeOrders.forEach(order => {
        const baseTime = order.estimatedDeliveryAt 
          ? new Date(order.estimatedDeliveryAt) 
          : new Date(new Date(order.createdAt).getTime() + 15 * 60 * 1000 + 30000); // 15m 30s fallback
        
        const remaining = Math.round((baseTime - new Date()) / 1000);
        newSeconds[order._id] = Math.max(0, remaining);
        
        if (remaining <= 0 && order.orderStatus !== "DELIVERED") {
          anyZero = true;
        }
      });
      
      setSecondsRemaining(newSeconds);
      if (anyZero) {
        fetchActiveOrder(); // Sync with server immediately
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeOrders]);

  useEffect(() => {
    if (location.pathname !== "/cart") {
      setHideStrip(false);
      return;
    }

    const handleScroll = () => {
      const btn = document.getElementById("checkout-btn");
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight;
        setHideStrip(isVisible);
      } else {
        const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 150;
        setHideStrip(isNearBottom);
      }
    };
    
    setTimeout(handleScroll, 100);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [location.pathname, cartTotal]);

  if (!isLoggedIn) return null;
  
  const hasCart = totalItems > 0;
  const activeCount = activeOrders.length;
  const isTrackingPage = location.pathname.includes("/order/tracking");

  if (!hasCart && activeCount === 0) return null;
  if (isTrackingPage) return null;

  // Find current order to display
  const currentOrderId = mode === "CART" ? null : mode;
  const currentOrder = activeOrders.find(o => o._id === currentOrderId) || activeOrders[0];
  const finalMode = (hasCart && mode === "CART") ? "CART" : (currentOrder ? currentOrder._id : "CART");

  const isCartPage = location.pathname === "/cart";

  const handleAction = (e) => {
    if (e.target.closest(".mode-switch")) return;

    if (finalMode !== "CART" && currentOrder) {
      navigate(`/order/tracking/${currentOrder._id}`);
    } else if (isCartPage) {
      const btn = document.getElementById("checkout-btn");
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
      else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
      navigate("/cart");
    }
  };

  return (
    <div className="cart-strip-container" style={{
      position: "fixed",
      bottom: hideStrip ? -100 : 24,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      padding: "0 16px",
      pointerEvents: "none",
      transition: "bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s",
      opacity: hideStrip ? 0 : 1
    }}>
      {/* Dynamic Mode Switcher for multiple orders */}
      {(hasCart && activeCount > 0) || activeCount > 1 ? (
        <div className="mode-switch" style={{ 
          display: "flex", 
          gap: "8px", 
          background: "rgba(0,0,0,0.6)", 
          padding: "6px 12px", 
          borderRadius: "20px",
          backdropFilter: "blur(12px)",
          pointerEvents: "auto",
          marginBottom: "-4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
        }}>
          {hasCart && (
            <div 
              onClick={() => setMode("CART")}
              style={{ 
                width: finalMode === "CART" ? "24px" : "10px", 
                height: "10px", 
                borderRadius: "5px", 
                background: finalMode === "CART" ? "var(--brand-green)" : "rgba(255,255,255,0.4)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "pointer"
              }}
            />
          )}
          {activeOrders.map((o, idx) => (
            <div 
              key={o._id}
              onClick={() => setMode(o._id)}
              style={{ 
                width: finalMode === o._id ? "24px" : "10px", 
                height: "10px", 
                borderRadius: "5px", 
                background: finalMode === o._id ? "#10b981" : "rgba(255,255,255,0.4)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "8px",
                fontWeight: 900
              }}
            >
              {activeCount > 1 && finalMode === o._id ? idx + 1 : ""}
            </div>
          ))}
        </div>
      ) : null}

      <div style={{
        maxWidth: 768,
        width: "100%",
        background: finalMode !== "CART" ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" : "var(--brand-green)",
        color: "#fff",
        borderRadius: 12,
        padding: "14px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        boxShadow: finalMode !== "CART" ? "0 12px 24px -8px rgba(16, 185, 129, 0.5)" : "0 12px 24px -8px rgba(12, 131, 31, 0.4)",
        pointerEvents: "auto",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        border: finalMode !== "CART" ? "1px solid rgba(255,255,255,0.2)" : "none",
        transform: "scale(1)",
      }} 
      onClick={handleAction}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px) scale(1.01)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0) scale(1)"}>
        
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ 
            background: "rgba(255,255,255,0.2)", 
            padding: "8px 12px", 
            borderRadius: 8, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center",
            justifyContent: "center"
          }}>
            {finalMode !== "CART" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            )}
          </div>
          <div key={finalMode} style={{ animation: "fadeIn 0.3s ease" }}>
            {finalMode !== "CART" && currentOrder ? (
              <>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", opacity: 0.9 }}>
                  {(() => {
                    const sec = secondsRemaining[currentOrder._id];
                    if (currentOrder.orderStatus === "DELIVERED") return "ORDER DELIVERED!";
                    if (sec !== undefined && sec > 0) {
                      const m = Math.floor(sec / 60);
                      const s = sec % 60;
                      return `ARRIVING IN ${m}m ${s}s`;
                    }
                    return "ORDER DELIVERED!";
                  })()}
                </div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                  {activeCount > 1 ? `ORDER #${activeOrders.indexOf(currentOrder) + 1}: ` : ""}
                  {(() => {
                    if (currentOrder.orderStatus === "DELIVERED") return "Rate Now ›";
                    const sec = secondsRemaining[currentOrder._id];
                    if (sec !== undefined && sec <= 0) return "Rate Now ›";
                    return currentOrder.orderStatus.replace(/_/g, " ");
                  })()}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", opacity: 0.9 }}>{totalItems} ITEM{totalItems > 1 ? "S" : ""}</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>₹{cartTotal}</div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", fontWeight: 700, fontSize: "1.1rem" }}>
            {finalMode !== "CART" ? "Track Order" : isCartPage ? "Make Payment" : "View Cart"} 
            <span style={{ marginLeft: 8, fontSize: "1.5rem", lineHeight: 1 }}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}
