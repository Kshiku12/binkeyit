import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingMoney, setAddingMoney] = useState(false);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiTimer, setUpiTimer] = useState(60);

  const fetchData = async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        api.get("/api/v2/auth/me"),
        api.get("/api/v2/orders/mine")
      ]);
      const userData = userRes.data.data;
      setUser(userData);
      setEditName(userData.name);
      setEditMobile(userData.mobile || "");
      setOrders(ordersRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch profile data", err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.patch("/api/v2/auth/profile", { name: editName, mobile: editMobile });
      await fetchData();
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  const [paymentState, setPaymentState] = useState("IDLE"); // IDLE, PROCESSING, SUCCESS

  const handleTopup = async () => {
    const val = parseFloat(topupAmount);
    if (!val || val <= 0) return alert("Please enter a valid amount");
    
    setPaymentState("PROCESSING");
    setAddingMoney(true);

    // Simulate payment verification
    setTimeout(async () => {
      try {
        await api.post("/api/v2/auth/wallet/add", { amount: val, paymentMethod });
        setPaymentState("SUCCESS");
        setTimeout(async () => {
          setTopupAmount("");
          setIsTopupModalOpen(false);
          setPaymentState("IDLE");
          await fetchData();
        }, 1500);
      } catch (err) {
        alert("Top-up failed");
        setPaymentState("IDLE");
      } finally {
        setAddingMoney(false);
      }
    }, 2500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loading-screen"><h2>Loading Dashboard...</h2></div>;

  return (
    <div className="profile-container">
      <div className="profile-glass-card">
        
        {/* User Info Header */}
        <div className="user-profile-header">
          <div className="avatar-large">
            {user?.name?.[0]?.toUpperCase() || "U"}
            <div className="rating-badge">★ {user?.userRating?.toFixed(1) || "5.0"}</div>
          </div>
          <div className="user-details-text">
            {isEditing ? (
              <div className="edit-profile-form">
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="edit-input" 
                  placeholder="Your Name"
                />
                <input 
                  type="text" 
                  value={editMobile} 
                  onChange={e => setEditMobile(e.target.value)} 
                  className="edit-input" 
                  placeholder="Mobile Number"
                />
                <div className="edit-actions">
                  <button onClick={handleUpdateProfile} className="save-btn">Save</button>
                  <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h1>{user?.name}</h1>
                  <button onClick={() => setIsEditing(true)} className="edit-toggle-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
                <p className="user-meta">{user?.email} • {user?.mobile || "No phone linked"}</p>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          
          {/* Wallet Card */}
          <div className="dashboard-item wallet-card">
            <div className="item-header">
              <h3>My Binkeyit Wallet</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div className="wallet-balance">
              <span className="currency">₹</span>
              <span className="amount">{user?.walletBalance?.toLocaleString() || "0"}</span>
            </div>
            <button className="add-money-trigger" onClick={() => setIsTopupModalOpen(true)}>
              + Add Money to Wallet
            </button>
          </div>


          {/* Quick Stats */}
          <div className="dashboard-item stats-card">
            <div className="item-header">
              <h3>Shopping Insights</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
            </div>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-value">{orders.length}</div>
                <div className="stat-label">Total Orders</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">₹{orders.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}</div>
                <div className="stat-label">Total Spent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Orders List */}
        <div className="orders-section">
          <h2 className="section-title">Order History</h2>
          <div className="orders-list">
            {orders.length === 0 ? (
              <p className="empty-msg">No orders found yet. Start shopping!</p>
            ) : (
              orders.map(order => (
                <div key={order._id} className="order-history-card">
                  <div className="order-card-main">
                    <div className="order-card-left">
                      <div className="order-id">#{order.orderCode}</div>
                      <div className="order-date">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="order-items-preview">
                        {order.items.map(i => i.name).join(", ")}
                      </div>
                    </div>
                    <div className="order-card-right">
                      <div className="order-amount">₹{order.total}</div>
                      <div className={`order-status-badge ${order.orderStatus.toLowerCase()}`}>
                        {order.orderStatus.replace(/_/g, " ")}
                      </div>
                      <Link to={`/order/tracking/${order._id}`} className="view-details-btn">Details ›</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Wallet History */}
        <div className="orders-section">
          <h2 className="section-title">Wallet Transactions</h2>
          <div className="wallet-history-list">
            {!user?.walletTransactions?.length ? (
              <p className="empty-msg">No transactions yet.</p>
            ) : (
              [...user.walletTransactions].reverse().map((tx, idx) => (
                <div key={idx} className="tx-card">
                  <div className="tx-left">
                    <div className="tx-icon">
                      {tx.type === "TOPUP" ? "↓" : "↑"}
                    </div>
                    <div>
                      <div className="tx-type">{tx.type}</div>
                      <div className="tx-date">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={`tx-amount ${tx.type === 'TOPUP' ? 'plus' : 'minus'}`}>
                    {tx.type === 'TOPUP' ? '+' : '-'}₹{tx.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Top-up Modal */}
      {isTopupModalOpen && (
        <div className="modal-overlay" onClick={() => paymentState === 'IDLE' && setIsTopupModalOpen(false)}>
          <div className="modal-content profile-topup-modal" onClick={e => e.stopPropagation()} style={{ padding: 24, background: "var(--card-bg)", position: "relative", overflow: "hidden" }}>
            
            {/* Processing Overlay */}
            {paymentState !== 'IDLE' && (
              <div className="payment-overlay" style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(255,255,255,0.95)", zIndex: 10,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", animation: "fadeIn 0.3s"
              }}>
                {paymentState === 'PROCESSING' ? (
                  <>
                    <div className="spinner"></div>
                    <h3 style={{ margin: "20px 0 8px 0", color: "#1e293b" }}>Processing Payment</h3>
                    <p style={{ color: "#64748b", margin: 0 }}>Communicating with your bank...</p>
                  </>
                ) : (
                  <>
                    <div className="success-check">✓</div>
                    <h3 style={{ margin: "20px 0 8px 0", color: "var(--brand-green)" }}>Payment Successful!</h3>
                    <p style={{ color: "#64748b", margin: 0 }}>₹{topupAmount} added to wallet</p>
                  </>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Top-up Wallet</h3>
              <button className="modal-close-btn" onClick={() => setIsTopupModalOpen(false)}>×</button>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>ENTER AMOUNT</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.03)", padding: "12px 20px", borderRadius: 16, border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-green)" }}>₹</span>
                <input 
                  type="number" 
                  value={topupAmount} 
                  onChange={e => setTopupAmount(e.target.value)} 
                  placeholder="500"
                  style={{ border: "none", background: "none", outline: "none", fontSize: "1.5rem", fontWeight: 800, width: "100%", color: "var(--text-dark)" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div 
                onClick={() => setPaymentMethod("UPI")}
                style={{ padding: 16, borderRadius: 16, border: "1px solid", borderColor: paymentMethod === 'UPI' ? 'var(--brand-green)' : 'var(--border-color)', background: paymentMethod === 'UPI' ? 'var(--brand-green-light)' : 'transparent', cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
              >
                <div style={{ fontWeight: 800, color: paymentMethod === 'UPI' ? 'var(--brand-green)' : 'var(--text-muted)' }}>UPI</div>
              </div>
              <div 
                onClick={() => setPaymentMethod("CARD")}
                style={{ padding: 16, borderRadius: 16, border: "1px solid", borderColor: paymentMethod === 'CARD' ? 'var(--brand-green)' : 'var(--border-color)', background: paymentMethod === 'CARD' ? 'var(--brand-green-light)' : 'transparent', cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
              >
                <div style={{ fontWeight: 800, color: paymentMethod === 'CARD' ? 'var(--brand-green)' : 'var(--text-muted)' }}>CARD</div>
              </div>
            </div>

            {paymentMethod === "UPI" && topupAmount && (
              <div style={{ textAlign: "center", padding: 20, background: "#f8fafc", borderRadius: 16, marginBottom: 24, border: "1px dashed #cbd5e1" }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=8971636441@ptsbi&pn=Binkeyit&am=${topupAmount}&cu=INR`)}`} alt="QR" style={{ borderRadius: 8 }} />
                <p style={{ margin: "12px 0 0 0", fontSize: "0.85rem", fontWeight: 700, color: "#64748b" }}>Scan to pay ₹{topupAmount}</p>
              </div>
            )}

            <button 
              className="futuristic-btn" 
              onClick={handleTopup}
              disabled={addingMoney || !topupAmount}
            >
              {addingMoney ? "Processing..." : `PAY ₹${topupAmount || 0}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
