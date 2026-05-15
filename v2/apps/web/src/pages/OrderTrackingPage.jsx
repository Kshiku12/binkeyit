import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../api/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const riderIcon = L.icon({
  iconUrl: '/rider_3d.png',
  iconSize: [60, 60],
  iconAnchor: [30, 30]
});

const homeIcon = L.icon({
  iconUrl: '/home_3d.png',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  className: 'transparent-marker'
});

// Add CSS override to the document
const style = document.createElement('style');
style.innerHTML = `
  .leaflet-marker-icon {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
`;
document.head.appendChild(style);

// Helper to get a point ~1.5km from user
const getNearbyStore = (userLoc) => {
  return [userLoc[0] + 0.01, userLoc[1] + 0.01];
};

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:8081", {
  autoConnect: true,
  withCredentials: true
});

const DRIVER_NAMES = ["Ramesh Kumar", "Suresh Singh", "Mohammad Ali", "Rajesh Sharma", "Deepak Verma"];

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [driver, setDriver] = useState({ name: "Assigning...", rating: "4.9", phone: "Loading..." });
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [error, setError] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [userLocation, setUserLocation] = useState([12.9716, 77.5946]); // Default Bengaluru (Karnataka)
  const [storeLocation, setStoreLocation] = useState(getNearbyStore([12.9716, 77.5946]));
  const [traveledPath, setTraveledPath] = useState([]);

  // Get User's Live Location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const uLoc = [latitude, longitude];
        setUserLocation(uLoc);
        const sLoc = getNearbyStore(uLoc);
        setStoreLocation(sLoc);
        setRiderLocation(sLoc); // Start at store
        setTraveledPath([sLoc]);
      }, (err) => {
        console.warn("Location access denied, using default.");
      });
    }
  }, []);

  // Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const glowLineRef = useRef(null);

  useEffect(() => {
    if (!orderId) {
      const oid = prompt("Enter Order ID:");
      if (oid) navigate(`/order/tracking/${oid}`);
    } else {
      loadOrder(orderId);
    }
  }, [orderId]);

  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.connect();
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onReconnecting = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnecting", onReconnecting);
    socket.on("reconnect", onConnect);

    const handler = (payload) => {
      console.log("Tracking update received:", payload);
      
      if (payload.location) {
        const newLoc = [payload.location.lat, payload.location.lng];
        setRiderLocation(newLoc);
        setTraveledPath(prev => {
          const newPath = [...prev, newLoc];
          if (riderMarkerRef.current) {
            riderMarkerRef.current.setLatLng(newLoc);
          }
          if (routeLineRef.current) routeLineRef.current.setLatLngs(newPath);
          if (glowLineRef.current) glowLineRef.current.setLatLngs(newPath);
          return newPath;
        });

        if (order?.orderStatus === "OUT_FOR_DELIVERY" && mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newLoc, { animate: true });
        }
      }

      setOrder((prev) => ({ ...(prev || {}), ...payload }));
      
      // Update Driver if needed
      if (payload.orderStatus && ["CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(payload.orderStatus)) {
        setDriver(prev => {
          if (prev.name === "Assigning...") {
            const hash = orderId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
            const name = DRIVER_NAMES[Math.abs(hash) % DRIVER_NAMES.length];
            return { ...prev, name };
          }
          return prev;
        });
      }

      if (payload.estimatedDeliveryAt) {
        const remaining = Math.round((new Date(payload.estimatedDeliveryAt) - new Date()) / 1000);
        setSecondsRemaining(Math.max(0, remaining));
      }
      setEvents(payload.tracking || []);
    };
    
    socket.on("order:tracking:update", handler);
    return () => {
      socket.off("order:tracking:update", handler);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnecting", onReconnecting);
      socket.off("reconnect", onConnect);
    };
  }, [order?.orderStatus]);

  const [riderRate, setRiderRate] = useState(0);
  const [orderRate, setOrderRate] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);

  const loadOrder = async (id) => {
    try {
      const res = await api.get(`/api/v2/orders/${id}`);
      const orderData = res.data.data;
      setOrder(orderData);
      setEvents(orderData.tracking || []);
      if (orderData.riderRating) setRiderRate(orderData.riderRating);
      if (orderData.orderRating) setOrderRate(orderData.orderRating);

      // Set locations from order data
      if (orderData.destLat && orderData.destLng) {
        const dest = [orderData.destLat, orderData.destLng];
        setUserLocation(dest);
        if (orderData.startLat && orderData.startLng) {
          const start = [orderData.startLat, orderData.startLng];
          setStoreLocation(start);
          setRiderLocation(start);
        } else {
          const start = getNearbyStore(dest);
          setStoreLocation(start);
          setRiderLocation(start);
        }
      }

      // Handle Driver Name
      if (orderData.riderId?.name) {
        setDriver({ 
          name: orderData.riderId.name, 
          rating: "4.9", 
          phone: orderData.riderId.mobile || "9876543210" 
        });
      } else if (["CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderData.orderStatus)) {
        const hash = id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const name = DRIVER_NAMES[Math.abs(hash) % DRIVER_NAMES.length];
        setDriver({ name, rating: "4.9", phone: "9876543210" });
      }

      socket.emit("order:join", { orderId: id });
    } catch (e) {
      console.error(e);
      setError("Failed to load order.");
    }
  };

  const submitRating = async () => {
    try {
      await api.post(`/api/v2/orders/${orderId}/rate`, {
        riderRating: riderRate,
        orderRating: orderRate
      });
      localStorage.setItem(`rated_${orderId}`, "true");
      setShowThankYou(true);
    } catch (err) {
      alert("Failed to save rating.");
    }
  };

  // Initialize Map
  useEffect(() => {
    const isMapNeeded = order && ["CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"].includes(order.orderStatus);
    
    if (isMapNeeded && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: storeLocation,
        zoom: 15,
        zoomControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png').addTo(map);

      // Remaining Path (Faded)
      L.polyline([storeLocation, userLocation], {
        color: '#10b981',
        weight: 4,
        opacity: 0.2,
        dashArray: '10, 15'
      }).addTo(map);

      // Traveled Glow Path (Highlighted)
      glowLineRef.current = L.polyline([storeLocation], {
        color: '#10b981',
        weight: 12,
        opacity: 0.2
      }).addTo(map);

      routeLineRef.current = L.polyline([storeLocation], {
        color: '#10b981',
        weight: 5,
        opacity: 1
      }).addTo(map);

      // Destination
      L.marker(userLocation, { icon: homeIcon }).addTo(map);

      // Rider (Custom Transparent DivIcon)
      riderMarkerRef.current = L.marker(storeLocation, { 
        icon: L.divIcon({
          html: `<img src="/rider_3d.png" style="width: 60px; height: 60px; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));" />`,
          className: 'transparent-marker',
          iconSize: [60, 60],
          iconAnchor: [30, 30]
        })
      }).addTo(map);
      
      mapInstanceRef.current = map;
      map.fitBounds(L.latLngBounds([storeLocation, userLocation]), { padding: [100, 100] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order?.orderStatus, userLocation, storeLocation]);

  // Sync Rider Position & Route
  useEffect(() => {
    if (riderLocation && riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng(riderLocation);
      if (routeLineRef.current) routeLineRef.current.setLatLngs(traveledPath);
      if (glowLineRef.current) glowLineRef.current.setLatLngs(traveledPath);
      
      if (order?.orderStatus === "OUT_FOR_DELIVERY" && mapInstanceRef.current) {
        mapInstanceRef.current.panTo(riderLocation, { animate: true });
      }
    }
  }, [riderLocation, traveledPath, order?.orderStatus]);

  // Live Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      let target;
      if (order?.estimatedDeliveryAt) {
        target = new Date(order.estimatedDeliveryAt);
      } else if (order?.createdAt) {
        // Fallback: 15 mins from creation
        target = new Date(new Date(order.createdAt).getTime() + 15 * 60 * 1000 + 30000);
      }

      if (target) {
        const remaining = Math.round((target - new Date()) / 1000);
        setSecondsRemaining(Math.max(0, remaining));
        
        // Auto-refresh order when timer hits 0 to get the final DELIVERED status
        if (remaining === 0 && order.orderStatus !== "DELIVERED") {
          loadOrder(orderId);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.estimatedDeliveryAt, order?.createdAt, order?.orderStatus]);



  if (error) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "32px", borderRadius: "24px", maxWidth: "450px", margin: "0 auto", boxShadow: "0 10px 30px rgba(185, 28, 28, 0.1)" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "16px" }}>Access Denied</h2>
          <p style={{ fontSize: "1.1rem", marginBottom: "24px", opacity: 0.9 }}>{error}</p>
          <button className="futuristic-btn" style={{ background: "#b91c1c" }} onClick={() => navigate("/")}>Return to Home</button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
        <div className="qr-scanner-line" style={{ width: "100px", height: "4px", margin: "0 auto 24px" }}></div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-muted)" }}>Connecting to Live Tracker...</h2>
      </div>
    );
  }

  const currentIndex = ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"].indexOf(order.orderStatus);

  return (
    <div className="container" style={{ padding: "24px 0 60px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>Order Tracking</h2>
        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>ID: {order.orderCode}</span>
      </div>
      
      <div className="cart-layout">
        <div className="cart-left">
          
          {/* Rating Section (Only shown when Delivered) */}
          {(order.orderStatus === "DELIVERED" || secondsRemaining === 0) && (
            <div className="cart-card" style={{ 
              background: "linear-gradient(135deg, #fff 0%, #f0fdf4 100%)", 
              border: "2px solid var(--brand-green)",
              textAlign: "center",
              padding: "40px 24px",
              animation: "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--brand-green)", marginBottom: 8 }}>Order Delivered!</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 32, fontWeight: 600 }}>We hope you enjoyed your shopping experience.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: "400px", margin: "0 auto" }}>
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 12, fontSize: "1.1rem" }}>Rate your Rider</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                    {[1,2,3,4,5].map(s => (
                      <span 
                        key={s} 
                        onClick={() => setRiderRate(s)}
                        style={{ 
                          fontSize: "2.5rem", 
                          cursor: "pointer", 
                          color: s <= riderRate ? "#f59e0b" : "#e5e7eb",
                          transition: "color 0.2s"
                        }}
                      >★</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, marginBottom: 12, fontSize: "1.1rem" }}>Rate the Order Quality</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                    {[1,2,3,4,5].map(s => (
                      <span 
                        key={s} 
                        onClick={() => setOrderRate(s)}
                        style={{ 
                          fontSize: "2.5rem", 
                          cursor: "pointer", 
                          color: s <= orderRate ? "#f59e0b" : "#e5e7eb",
                          transition: "color 0.2s"
                        }}
                      >★</span>
                    ))}
                  </div>
                </div>

                <button 
                  className="futuristic-btn" 
                  style={{ marginTop: 16, width: "100%", padding: "18px" }}
                  onClick={submitRating}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          )}

          {/* Live Rider Map (Only shown during active delivery) */}
          {["CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"].includes(order.orderStatus) && secondsRemaining > 0 && (
            <div className="cart-card" style={{ marginBottom: 24, padding: 0, overflow: "hidden", position: "relative", height: "350px", border: "1px solid var(--brand-green)", boxShadow: "0 0 20px rgba(16, 185, 129, 0.1)" }}>
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "6px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(4px)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: isConnected ? "#10b981" : "#ef4444", animation: isConnected ? "pulse 1.5s infinite" : "none" }}></div>
                {isConnected ? (order.orderStatus === 'OUT_FOR_DELIVERY' ? 'LIVE TRACKING' : 'ORDER PREPARING') : 'RECONNECTING...'}
              </div>
              <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }}></div>
            </div>
          )}

          <div className="cart-card" style={{ marginBottom: 24 }}>
            <h3 className="cart-section-title">Order Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
              {[
                { title: "Order Placed", desc: "We have received your order" },
                { title: "Order Confirmed", desc: "Your order has been confirmed" },
                { title: "Order Packed", desc: "Items are packed and ready to ship" },
                { title: "Out for Delivery", desc: "Driver is on the way to your location" },
                { title: "Delivered", desc: "Order delivered successfully" },
              ].map((step, idx) => {
                const isActive = currentIndex >= idx;
                const isCurrent = currentIndex === idx;
                return (
                  <div key={idx} style={{ display: "flex", gap: 16, opacity: isActive ? 1 : 0.4 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: isActive ? "var(--brand-green)" : "var(--border-color)", border: isCurrent ? "4px solid var(--brand-green-light)" : "none", transition: "all 0.3s ease" }}></div>
                      {idx < 4 && <div style={{ width: 2, height: 40, background: isActive && currentIndex > idx ? "var(--brand-green)" : "var(--border-color)", marginTop: 4 }}></div>}
                    </div>
                    <div style={{ marginTop: -2 }}>
                      <div style={{ fontWeight: 800, color: "var(--text-dark)", fontSize: "1.05rem" }}>{step.title}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {order.orderStatus !== "PLACED" && order.orderStatus !== "CONFIRMED" && (
            <div className="cart-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${driver.name}`} alt="Driver" style={{ width: 48, height: 48, borderRadius: "50%" }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{driver.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" color="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    {driver.rating} Rating
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="cart-right">
          <div className="cart-card" style={{ position: "relative", overflow: "hidden" }}>
            {/* Premium Delivery Timer Header */}
            {order.orderStatus !== "DELIVERED" && secondsRemaining > 0 && (
              <div style={{ 
                background: "linear-gradient(90deg, #10b981 0%, #059669 100%)", 
                margin: "-24px -24px 24px -24px", 
                padding: "20px 24px",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px" }}>Arriving In</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
                    {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                  </div>
                </div>
                <div style={{ 
                  background: "rgba(255,255,255,0.2)", 
                  padding: "10px", 
                  borderRadius: "12px",
                  animation: "pulse 2s infinite"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
              </div>
            )}

            <h3 className="cart-section-title">Order Summary</h3>
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>{item.quantity}x</div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>₹{(item.unitPrice || item.price) * item.quantity}</div>
                </div>
              ))}
            </div>
            
            <div className="bill-row total" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-color)" }}>
              <span>Grand Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Thank You Modal */}
      {showThankYou && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
          animation: "fadeIn 0.3s ease"
        }}>
          <div style={{
            background: "#fff",
            maxWidth: "450px",
            width: "100%",
            borderRadius: "24px",
            padding: "48px 32px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            animation: "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ fontSize: "4rem", marginBottom: 24 }}>✨</div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand-green)", marginBottom: 12 }}>Thank You!</h2>
            <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.6, fontWeight: 600 }}>
              Your feedback helps us make <b>Binkeyit</b> better for everyone. We've saved your rating to our database.
            </p>
            <button 
              className="futuristic-btn" 
              style={{ width: "100%", padding: "18px", fontSize: "1.1rem" }}
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
