import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../state/CartContext";
import { api } from "../api/client.js";

export default function CartPage() {
  const { cart, updateItemQty, cartTotal, loading } = useCart();
  const navigate = useNavigate();
  
  const [instruction, setInstruction] = useState("");
  const [tip, setTip] = useState(0);

  // Modal States
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Coupon & Address States
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  // New Address Wizard States
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressStep, setAddressStep] = useState(1);
  const [baseAddress, setBaseAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [building, setBuilding] = useState("");
  const [addressType, setAddressType] = useState("Home");
  const [isLocating, setIsLocating] = useState(false);
  const [tempAddressInput, setTempAddressInput] = useState("");
  
  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [savedCardsState, setSavedCardsState] = useState([]);
  const [cardDetails, setCardDetails] = useState({ cardNumber: "", name: "", expiry: "", cvv: "" });
  const [saveCard, setSaveCard] = useState(false);
  const [upiTimer, setUpiTimer] = useState(300); // 5 mins
  const [paymentFailedModalOpen, setPaymentFailedModalOpen] = useState(false);
  const [upiIdInput, setUpiIdInput] = useState("");
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  const checkAuth = () => {
    const token = localStorage.getItem("v2_access_token");
    return !!token && token !== "undefined" && token !== "null";
  };
  const [isLoggedIn, setIsLoggedIn] = useState(checkAuth());
  const [user, setUser] = useState(null);

  const [currentAddress, setCurrentAddress] = useState(null);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(checkAuth());
      if (checkAuth()) {
        api.get("/api/v2/auth/me").then(res => {
          setUser(res.data.data);
          if (res.data.data.savedCards) setSavedCardsState(res.data.data.savedCards);
        }).catch(err => console.error(err));
      }
    };
    window.addEventListener("auth_change", handleAuthChange);
    handleAuthChange();
    return () => window.removeEventListener("auth_change", handleAuthChange);
  }, []);

  useEffect(() => {
    let timer;
    if (isPaymentModalOpen && paymentMethod === "UPI" && upiTimer > 0) {
      timer = setInterval(() => setUpiTimer(t => t - 1), 1000);
    } else if (upiTimer === 0) {
      setIsPaymentModalOpen(false);
      setPaymentFailedModalOpen(true);
      setUpiTimer(300);
    }
    return () => clearInterval(timer);
  }, [isPaymentModalOpen, paymentMethod, upiTimer]);

  // Remove automatic UPI placement to prevent premature redirection
  useEffect(() => {
    // Logic moved to manual button for better UX
  }, [isPaymentModalOpen, paymentMethod]);

  const handlePlaceOrder = async (method, isSuccess) => {
    if (!isSuccess) {
      setIsPaymentModalOpen(false);
      setPaymentFailedModalOpen(true);
      return;
    }

    if (method === "CARD" && saveCard) {
      try {
        await api.post("/api/v2/auth/cards", cardDetails);
      } catch (err) {
        console.error("Failed to save card", err);
      }
    }

    try {
      const addrId = currentAddress?.id || currentAddress?._id;
      if (!addrId) {
        alert("Address ID is missing. Please select an address again.");
        return;
      }

      const res = await api.post("/api/v2/orders", {
        addressId: addrId,
        paymentMethod: method,
        upiId: method === "UPI" ? "user@upi" : ""
      });

      if (res.data?.success) {
        console.log("Order placed successfully:", res.data.data.order._id);
        window.dispatchEvent(new Event("cart_change"));
        navigate(`/order/tracking/${res.data.data.order._id}`);
      } else {
        console.error("Order placement failed:", res.data?.message);
        setIsPaymentModalOpen(false);
        setPaymentFailedModalOpen(true);
      }
    } catch (err) {
      console.error("Order placement error:", err.response?.data || err.message);
      setIsPaymentModalOpen(false);
      setPaymentFailedModalOpen(true);
    }
  };

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      const token = localStorage.getItem("v2_access_token");
      if (!token) return;
      try {
        const res = await api.get("/api/v2/addresses");
        const data = res.data;
        if (data && data.length > 0) {
          setSavedAddresses(data);
          const def = data.find(a => a.isDefault) || data[0];
          setCurrentAddress({
            type: def.addressType,
            apartment: def.apartment,
            building: def.building,
            base: def.baseAddress,
            id: def._id
          });
        }
      } catch (err) {
        console.error("Error fetching addresses", err);
      }
    };
    fetchAddresses();
  }, []);

  // Delivery / Handling calculations
  const deliveryFee = cartTotal > 300 ? 0 : 25;
  const handlingFee = 4;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  
  let grandTotal = 0;
  if (cartTotal > 0) {
    grandTotal = cartTotal + deliveryFee + handlingFee + tip - couponDiscount;
    if (grandTotal < 0) grandTotal = 0;
  }

  const handleApplyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
    setIsOffersModalOpen(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    
    const geoOptions = {
      enableHighAccuracy: false, // Changed to false for instant IP-based fallback on desktops
      timeout: 10000,
      maximumAge: Infinity // Use cached location if available for instant response
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setBaseAddress(data.display_name);
            setAddressStep(3); // Move to Step 3
          } else {
            throw new Error("Nominatim missing display_name");
          }
        } catch (err) {
          console.error(err);
          fallbackToIPLocation();
        }
      }, 
      (error) => {
        console.error("GPS Error:", error);
        // Silently fallback to IP based location instead of alerting the user
        fallbackToIPLocation();
      },
      geoOptions
    );
  };

  const fallbackToIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data && data.city) {
        const fallbackAddress = `${data.city}, ${data.region}, ${data.country_name}`;
        setBaseAddress(fallbackAddress);
        setAddressStep(3); // Move to Step 3
      } else {
        alert("Failed to get location automatically. Please use the manual search bar.");
      }
    } catch (err) {
      alert("Failed to get location automatically. Please use the manual search bar.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleManualAddressSubmit = (e) => {
    if (e.key === 'Enter' && tempAddressInput.trim() !== "") {
      setBaseAddress(tempAddressInput);
      setTempAddressInput("");
      setAddressStep(3); // Move to Step 3
    }
  };

  const handleSaveFullAddress = async () => {
    if (!apartment.trim() || !building.trim()) {
      alert("Please enter apartment and building details.");
      return;
    }

    const token = localStorage.getItem("v2_access_token");
    if (!token) {
      alert("Please log in to save addresses.");
      return;
    }

    try {
      const res = await api.post("/api/v2/addresses", {
        addressType,
        apartment,
        building,
        baseAddress,
        isDefault: true
      });
      
      const newAddr = res.data;
      setCurrentAddress({
        type: newAddr.addressType,
        apartment: newAddr.apartment,
        building: newAddr.building,
        base: newAddr.baseAddress,
        id: newAddr._id
      });
      
      setSavedAddresses(prev => [newAddr, ...prev.map(a => ({...a, isDefault: false}))]);
      
      // Reset wizard and close modal
      setAddressStep(savedAddresses.length > 0 ? 1 : 2);
      setIsAddressModalOpen(false);
      setApartment("");
      setBuilding("");
      setAddressType("Home");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save address to server.");
    }
  };

  const openAddressModal = () => {
    setAddressStep(savedAddresses.length > 0 ? 1 : 2);
    setIsAddressModalOpen(true);
  };

  const renderAddressIcon = (type) => {
    switch (type) {
      case "Home":
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
      case "Office":
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>;
      case "Hotel":
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6l7-3 7 3"></path><path d="M4 10v11"></path><path d="M20 10v11"></path><path d="M8 14v3"></path><path d="M12 14v3"></path><path d="M16 14v3"></path></svg>;
      default:
        return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "linear-gradient(135deg, var(--brand-green-light) 0%, #fff 100%)", width: 120, height: 120, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 12px 24px -8px rgba(12, 131, 31, 0.3)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: 12 }}>Almost there!</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: 400, marginBottom: 32, lineHeight: 1.6 }}>
          Login to view your cart items, apply exciting offers, and checkout in seconds.
        </p>
        <Link to="/login">
          <button className="futuristic-btn" style={{ padding: "16px 48px", fontSize: "1.2rem", width: "auto" }}>
            Login to Continue
          </button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40, textAlign: "center" }}>
        <h2>Loading Cart...</h2>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 60, textAlign: "center", minHeight: "60vh" }}>
        <img src="https://cdn.grofers.com/assets/ui/empty_states/emp_empty_cart.png" alt="Empty Cart" style={{ width: 250, marginBottom: 20 }} />
        <h2>Your cart is empty</h2>
        <p className="small" style={{ marginBottom: 24 }}>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/">
          <button className="btn btn-primary" style={{ padding: "12px 32px", fontSize: "1.1rem" }}>Browse Products</button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="container" style={{ padding: "24px 0 60px 0" }}>
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "24px" }}>Checkout</h2>
        
        <div className="cart-layout">
          
          {/* LEFT COLUMN: Items and Preferences */}
          <div className="cart-left">
            
            {/* Animated Delivery Header */}
            <div className="cart-card" style={{ background: "linear-gradient(135deg, var(--brand-green-light) 0%, #fff 100%)", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ background: "var(--brand-green)", color: "#fff", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Delivery in 10 minutes</h3>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>Shipment of {cart.length} item{cart.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="cart-card">
              <h3 className="cart-section-title">Items</h3>
              {cart.map((item) => {
                const product = item.productId;
                if (!product) return null;
                
                const price = product.price || 0;
                const finalPrice = price - Math.ceil((price * (product.discount || 0)) / 100);

                return (
                  <div key={item._id} className="cart-item-row">
                    <img src={product.image?.[0] || "https://via.placeholder.com/150"} alt={product.name} className="cart-item-image" />
                    
                    <div className="cart-item-info">
                      <div className="cart-item-title">{product.name}</div>
                      <div className="cart-item-unit">{product.unit || "1 unit"}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: 4 }}>₹{finalPrice}</div>
                    </div>
                    
                    <div className="cart-item-price-col">
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateItemQty(product._id, item._id, item.quantity - 1)}>−</button>
                        <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateItemQty(product._id, item._id, item.quantity + 1)}>+</button>
                      </div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-green)" }}>
                        ₹{finalPrice * item.quantity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Delivery Instructions */}
            <div className="cart-card">
              <h3 className="cart-section-title">Delivery Instructions</h3>
              <div className="instruction-grid">
                <div className={`instruction-badge ${instruction === "bell" ? "active" : ""}`} onClick={() => setInstruction(instruction === "bell" ? "" : "bell")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                  Do not ring bell
                </div>
                <div className={`instruction-badge ${instruction === "door" ? "active" : ""}`} onClick={() => setInstruction(instruction === "door" ? "" : "door")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V9a9 9 0 0 1 18 0v12"></path><path d="M9 21v-9a3 3 0 0 1 6 0v9"></path></svg>
                  Leave at door
                </div>
                <div className={`instruction-badge ${instruction === "guard" ? "active" : ""}`} onClick={() => setInstruction(instruction === "guard" ? "" : "guard")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Leave with guard
                </div>
                <div className={`instruction-badge ${instruction === "call" ? "active" : ""}`} onClick={() => setInstruction(instruction === "call" ? "" : "call")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Call me
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Checkout & Billing */}
          <div className="cart-right">
            
            {/* Offers */}
            <div className="cart-card" style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: appliedCoupon ? "1px solid var(--brand-green)" : "1px solid var(--border-color)", background: appliedCoupon ? "var(--brand-green-light)" : "rgba(255, 255, 255, 0.95)" }} onClick={() => setIsOffersModalOpen(true)}>
              <div style={{ background: appliedCoupon ? "var(--brand-green)" : "#fef08a", padding: 8, borderRadius: "50%" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={appliedCoupon ? "#fff" : "#ca8a04"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>
                  {appliedCoupon ? `Coupon Applied: ${appliedCoupon.code}` : "Avail Offers / Coupons"}
                </h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: appliedCoupon ? "var(--brand-green)" : "var(--text-muted)" }}>
                  {appliedCoupon ? `You saved ₹${appliedCoupon.discount} on this order!` : "Save extra on this order"}
                </p>
              </div>
              {appliedCoupon ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); setAppliedCoupon(null); }}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontWeight: 700 }}
                >
                  Remove
                </button>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              )}
            </div>

            {/* Tip */}
            <div className="cart-card">
              <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem" }}>Tip your delivery partner</h4>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>100% of the tip goes to the partner</p>
              <div className="tip-container">
                <div className={`tip-btn ${tip === 10 ? 'active' : ''}`} onClick={() => setTip(tip === 10 ? 0 : 10)}>₹10</div>
                <div className={`tip-btn ${tip === 20 ? 'active' : ''}`} onClick={() => setTip(tip === 20 ? 0 : 20)}>₹20</div>
                <div className={`tip-btn ${tip === 50 ? 'active' : ''}`} onClick={() => setTip(tip === 50 ? 0 : 50)}>₹50</div>
              </div>
            </div>

            {/* Bill Details */}
            <div className="cart-card">
              <h3 className="cart-section-title">Bill Details</h3>
              
              <div className="bill-row">
                <span>Item Total</span>
                <span>₹{cartTotal}</span>
              </div>
              
              <div className="bill-row">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span style={{ color: "var(--brand-green)", fontWeight: 700 }}>FREE <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "0.8rem" }}>₹25</span></span>
                ) : (
                  <span>₹{deliveryFee}</span>
                )}
              </div>
              {deliveryFee > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: -8, marginBottom: 12 }}>
                  Free delivery on orders above ₹300
                </div>
              )}

              <div className="bill-row">
                <span>Handling Fee</span>
                <span>₹{handlingFee}</span>
              </div>

              {tip > 0 && (
                <div className="bill-row">
                  <span>Delivery Partner Tip</span>
                  <span>₹{tip}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="bill-row" style={{ color: "var(--brand-green)" }}>
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}

              <div className="bill-row total">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            {/* Address & Payment */}
            <div className="cart-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px", display: "flex", gap: 12, alignItems: "flex-start", borderBottom: "1px solid var(--border-color)" }}>
                {currentAddress ? renderAddressIcon(currentAddress.type) : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: "1rem" }}>{currentAddress ? `Deliver to ${currentAddress.type}` : "Add a delivery address"}</span>
                    <button onClick={openAddressModal} style={{ background: "none", border: "none", color: "var(--brand-green)", fontWeight: 700, cursor: "pointer" }}>{currentAddress ? "Change" : "Add"}</button>
                  </div>
                  {currentAddress && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {currentAddress.apartment}, {currentAddress.building}, {currentAddress.base}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: "16px", background: "#f9fafb" }}>
                <button id="checkout-btn" className="futuristic-btn" onClick={() => {
                  if (!currentAddress) {
                    alert("Please select a delivery address first.");
                    openAddressModal();
                    return;
                  }
                  setIsPaymentModalOpen(true);
                  if (user && user.savedCards) setSavedCardsState(user.savedCards);
                }}>
                  Make Payment • ₹{grandTotal}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Payment Options Modal */}
      {isPaymentModalOpen && (
        <div className="modal-overlay" onClick={() => handlePlaceOrder(paymentMethod, false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: "hidden", maxWidth: 500, border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div className="modal-header" style={{ background: "linear-gradient(135deg, var(--brand-green) 0%, #0d9422 100%)", color: "#fff", borderBottom: "none", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "#fff", margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Select Payment Method</h3>
              <button style={{ background: "#ef4444", color: "#fff", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(239,68,68,0.5)", transition: "all 0.2s" }} onClick={() => handlePlaceOrder(paymentMethod, false)} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", overflowX: "auto" }}>
              <div className={`payment-tab ${paymentMethod === 'CARD' ? 'active' : ''}`} onClick={() => setPaymentMethod('CARD')}>Credit / Debit Card</div>
              <div className={`payment-tab ${paymentMethod === 'UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('UPI')}>UPI</div>
              <div className={`payment-tab ${paymentMethod === 'WALLET' ? 'active' : ''}`} onClick={() => setPaymentMethod('WALLET')}>Wallet</div>
              <div className={`payment-tab ${paymentMethod === 'COD' ? 'active' : ''}`} onClick={() => setPaymentMethod('COD')}>Cash on Delivery</div>
            </div>

            <div className="modal-body" style={{ padding: "24px", minHeight: 300 }}>
              {/* CARD TAB */}
              {paymentMethod === "CARD" && (
                <div style={{ animation: "pmFadeIn 0.3s ease-out" }}>
                  {savedCardsState.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem" }}>Saved Cards</h4>
                      {savedCardsState.map((card, idx) => (
                        <div key={idx} className="saved-card-row futuristic-input-container" onClick={() => {
                          setCardDetails({ ...cardDetails, cardNumber: card.cardNumber });
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                            <div>
                              <div style={{ fontWeight: 700 }}>{card.cardNumber}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{card.name}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem" }}>Enter Card Details</h4>
                  <div className="futuristic-input-container" style={{ marginBottom: 12 }}>
                    <input type="text" style={{ border: "none", outline: "none", width: "100%", padding: "12px", background: "transparent", fontSize: "1rem" }} placeholder="Card Number" value={cardDetails.cardNumber} onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})} />
                  </div>
                  <div className="futuristic-input-container" style={{ marginBottom: 12 }}>
                    <input type="text" style={{ border: "none", outline: "none", width: "100%", padding: "12px", background: "transparent", fontSize: "1rem" }} placeholder="Name on Card" value={cardDetails.name} onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})} />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div className="futuristic-input-container" style={{ flex: 1 }}>
                      <input type="text" style={{ border: "none", outline: "none", width: "100%", padding: "12px", background: "transparent", fontSize: "1rem" }} placeholder="MM/YY" value={cardDetails.expiry} onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})} />
                    </div>
                    <div className="futuristic-input-container" style={{ flex: 1 }}>
                      <input type="password" style={{ border: "none", outline: "none", width: "100%", padding: "12px", background: "transparent", fontSize: "1rem" }} placeholder="CVV" value={cardDetails.cvv} onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})} maxLength={3} />
                    </div>
                  </div>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", marginTop: 8, cursor: "pointer", userSelect: "none" }}>
                    <div className="futuristic-checkbox">
                      <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--brand-green)", cursor: "pointer" }} />
                    </div>
                    <span style={{ fontWeight: 500 }}>Securely save this card for future payments</span>
                  </label>

                  <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                    <button className="futuristic-btn" style={{ width: "100%", fontSize: "1.1rem", padding: "14px", fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }} onClick={() => handlePlaceOrder("CARD", true)}>
                      PAY NOW • ₹{grandTotal}
                    </button>
                  </div>
                </div>
              )}
              {paymentMethod === "UPI" && (
                <div style={{ textAlign: "center", animation: "pmFadeIn 0.3s ease-out" }}>
                  {!isVerifyingUpi ? (
                    <>
                      <h4 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 800 }}>Complete Payment</h4>
                      
                      {/* Deep Link Button for Mobile */}
                      <a 
                        href={`upi://pay?pa=8971636441@ptsbi&pn=Binkeyit&am=${grandTotal}&cu=INR&tn=Order_Payment`}
                        style={{ textDecoration: "none" }}
                        onClick={() => {
                          setIsVerifyingUpi(true);
                          setTimeout(() => handlePlaceOrder("UPI", true), 10000);
                        }}
                      >
                        <button className="futuristic-btn" style={{ width: "100%", background: "#10b981", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          OPEN UPI APP (MOBILE)
                        </button>
                      </a>

                      <div style={{ margin: "20px 0", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 700 }}>— OR SCAN QR —</div>

                      <div style={{ position: "relative", display: "inline-block", padding: 24, borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.3)", marginBottom: 16, background: "#fff", boxShadow: "0 10px 25px rgba(16, 185, 129, 0.1)" }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=8971636441@ptsbi&pn=Binkeyit&am=${grandTotal}&cu=INR&tn=Order_Payment`)}`} 
                          alt="UPI QR" 
                          style={{ display: "block" }}
                        />
                        <div className="qr-scanner-line"></div>
                      </div>

                      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 20 }}>Scan this QR with any UPI App to pay <b>₹{grandTotal}</b></p>
                      
                      <button 
                        className="btn btn-primary" 
                        style={{ width: "100%", opacity: 0.8, background: "var(--brand-green)" }}
                        onClick={() => {
                          setIsVerifyingUpi(true);
                          setTimeout(() => handlePlaceOrder("UPI", true), 8000);
                        }}
                      >
                        I HAVE PAID SUCCESSFULLY
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: "40px 0" }}>
                      <div className="payment-loader"></div>
                      <h4 style={{ marginTop: 24, fontSize: "1.2rem", color: "var(--brand-green)" }}>Detecting Payment...</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Please complete the payment in your UPI app.</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--brand-green)", fontWeight: 700, marginTop: 12, animation: "pulse 1.5s infinite" }}>Waiting for confirmation from your bank...</p>
                    </div>
                  )}
                </div>
              )}

              {/* WALLET TAB */}
              {paymentMethod === "WALLET" && (
                <div style={{ textAlign: "center", animation: "pmFadeIn 0.3s ease-out" }}>
                  <div style={{ background: "rgba(16, 185, 129, 0.1)", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </div>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: 4 }}>Binkeyit Wallet</h4>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#111827", marginBottom: 8 }}>₹{user?.walletBalance?.toLocaleString() || "0"}</div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: 24 }}>
                    {(user?.walletBalance || 0) < grandTotal 
                      ? "Insufficient balance. Please add money to your wallet." 
                      : "Deduct money directly from your Binkeyit Wallet."}
                  </p>
                  
                  <button 
                    className="futuristic-btn" 
                    disabled={(user?.walletBalance || 0) < grandTotal}
                    style={{ 
                      width: "100%", 
                      opacity: (user?.walletBalance || 0) < grandTotal ? 0.5 : 1,
                      cursor: (user?.walletBalance || 0) < grandTotal ? "not-allowed" : "pointer"
                    }}
                    onClick={() => handlePlaceOrder("WALLET", true)}
                  >
                    {(user?.walletBalance || 0) < grandTotal ? "Insufficient Balance" : `PAY NOW • ₹${grandTotal}`}
                  </button>
                  
                  {(user?.walletBalance || 0) < grandTotal && (
                    <Link to="/profile" style={{ display: "block", marginTop: 16, color: "var(--brand-green)", fontWeight: 700, textDecoration: "none" }}>
                      Add money to wallet ›
                    </Link>
                  )}
                </div>
              )}

              {/* COD TAB */}
              {paymentMethod === "COD" && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ background: "var(--brand-green-light)", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                  </div>
                  <h4 style={{ fontSize: "1.2rem", marginBottom: 8 }}>Pay on Delivery</h4>
                  <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>Pay via Cash, UPI, or Card when the order arrives at your doorstep.</p>
                  <button className="futuristic-btn" onClick={() => handlePlaceOrder("COD", true)}>
                    Place Order • ₹{grandTotal}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Failed Modal */}
      {paymentFailedModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ textAlign: "center", padding: "40px 24px", maxWidth: 400 }}>
            <div style={{ background: "#fee2e2", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--error-red)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: 12, color: "var(--text-dark)" }}>Payment Unsuccessful</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.5 }}>
              We could not process your payment at this time. Don't worry, your cart is perfectly safe. Please try again with a different payment method.
            </p>
            <button className="futuristic-btn" onClick={() => setPaymentFailedModalOpen(false)}>
              Retry Payment
            </button>
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {isOffersModalOpen && (
        <div className="modal-overlay" onClick={() => setIsOffersModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply Coupon</h3>
              <button className="modal-close-btn" onClick={() => setIsOffersModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="coupon-card">
                <div>
                  <div className="coupon-code">WELCOME50</div>
                  <div className="coupon-desc">Flat ₹50 off on your first order</div>
                </div>
                <button className="apply-btn" onClick={() => handleApplyCoupon({ code: "WELCOME50", discount: 50 })}>Apply</button>
              </div>
              <div className="coupon-card">
                <div>
                  <div className="coupon-code">SAVE20</div>
                  <div className="coupon-desc">Flat ₹20 off on orders above ₹100</div>
                </div>
                <button className="apply-btn" onClick={() => handleApplyCoupon({ code: "SAVE20", discount: 20 })}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Wizard Modal */}
      {isAddressModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{addressStep === 1 ? "Saved Addresses" : addressStep === 2 ? "Select Delivery Location" : "Complete Address"}</h3>
              <button className="modal-close-btn" onClick={() => setIsAddressModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="modal-body" style={{ overflow: "hidden" }}>
              
              {/* STEP 1: Address Book */}
              {addressStep === 1 && (
                <div className="address-wizard-step">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map(addr => (
                      <div 
                        key={addr._id} 
                        className={`saved-address-card ${currentAddress && currentAddress.id === addr._id ? 'selected' : ''}`}
                        onClick={() => {
                          setCurrentAddress({ type: addr.addressType, apartment: addr.apartment, building: addr.building, base: addr.baseAddress, id: addr._id });
                          setIsAddressModalOpen(false);
                        }}
                      >
                        <div style={{ marginTop: 2 }}>{renderAddressIcon(addr.addressType)}</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-dark)", marginBottom: 4 }}>{addr.addressType}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{addr.apartment}, {addr.building}, {addr.baseAddress}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>No saved addresses yet.</div>
                  )}
                  
                  <button className="futuristic-btn" onClick={() => setAddressStep(2)} style={{ background: "#fff", color: "var(--brand-green)", border: "1px solid var(--brand-green)", marginTop: 12 }}>
                    + Add New Address
                  </button>
                </div>
              )}

              {/* STEP 2: Search / Geolocation */}
              {addressStep === 2 && (
                <div className="address-wizard-step">
                  <button className="locator-btn" onClick={handleGetCurrentLocation} disabled={isLocating}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.39 10.74A7 7 0 0 0 13.26 4.61V2h-2.52v2.61A7 7 0 0 0 4.61 10.74H2v2.52h2.61a7 7 0 0 0 6.13 6.13V22h2.52v-2.61a7 7 0 0 0 6.13-6.13H22v-2.52h-2.61z"></path></svg>
                    {isLocating ? "Locating..." : "Use Current Location"}
                  </button>
                  
                  <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "16px 0", fontSize: "0.85rem", fontWeight: 600 }}>OR ENTER MANUALLY</div>
                  
                  <input 
                    type="text" 
                    className="address-input" 
                    placeholder="Search for your area, street, or building (Press Enter)" 
                    value={tempAddressInput}
                    onChange={(e) => setTempAddressInput(e.target.value)}
                    onKeyDown={handleManualAddressSubmit}
                  />

                  {savedAddresses.length > 0 && (
                    <button onClick={() => setAddressStep(1)} style={{ background: "none", border: "none", color: "var(--brand-green)", fontWeight: 700, width: "100%", marginTop: 16, cursor: "pointer" }}>
                      Back to Saved Addresses
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3: Detail Entry */}
              {addressStep === 3 && (
                <div className="address-wizard-step">
                  
                  <div className="base-address-preview">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <div style={{ lineHeight: 1.4 }}>{baseAddress}</div>
                  </div>

                  <input 
                    type="text" 
                    className="futuristic-input" 
                    placeholder="Apartment No. / Floor (Required)" 
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                  />
                  
                  <input 
                    type="text" 
                    className="futuristic-input" 
                    placeholder="Building / Block Name (Required)" 
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                  />

                  <div style={{ fontSize: "0.9rem", fontWeight: 700, margin: "8px 0 12px 0", color: "var(--text-dark)" }}>Save address as</div>
                  <div className="address-type-grid">
                    <div className={`address-type-badge ${addressType === "Home" ? "active" : ""}`} onClick={() => setAddressType("Home")}>
                      {renderAddressIcon("Home")} Home
                    </div>
                    <div className={`address-type-badge ${addressType === "Office" ? "active" : ""}`} onClick={() => setAddressType("Office")}>
                      {renderAddressIcon("Office")} Office
                    </div>
                    <div className={`address-type-badge ${addressType === "Hotel" ? "active" : ""}`} onClick={() => setAddressType("Hotel")}>
                      {renderAddressIcon("Hotel")} Hotel
                    </div>
                    <div className={`address-type-badge ${addressType === "Other" ? "active" : ""}`} onClick={() => setAddressType("Other")}>
                      {renderAddressIcon("Other")} Other
                    </div>
                  </div>

                  <button className="futuristic-btn" onClick={handleSaveFullAddress}>Save Address</button>
                  
                  <button onClick={() => setAddressStep(2)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontWeight: 700, width: "100%", marginTop: 16, cursor: "pointer" }}>
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
