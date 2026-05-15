import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import { useCart } from "../state/CartContext";

export default function AiAssistant() {
  const { updateItemQty, getQty, getCartItemId } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi! I'm your Binkeyit Assistant. How can I help you with your orders today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { type: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await api.post("/api/v2/ai/chat", { message: userMsg });
      if (res.data?.success) {
        const { response, products } = res.data.data;
        setMessages(prev => [...prev, { type: "bot", text: response, products }]);
      }
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg = err.response?.data?.message || "I'm having a little trouble connecting to my brain. Please check if the server is running!";
      setMessages(prev => [...prev, { type: "bot", text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const priceAfterDiscount = (price = 0, discount = 0) => {
    const off = Math.ceil((Number(price) * Number(discount || 0)) / 100);
    return Number(price) - off;
  };

  return (
    <div className="ai-assistant-container" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000 }}>
      {/* Chat Bubble Toggle */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="ai-bubble-btn"
          style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--brand-green) 0%, #10b981 100%)",
            border: "none", color: "white", cursor: "pointer",
            boxShadow: "0 12px 24px rgba(12, 131, 31, 0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1) rotate(5deg)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1) rotate(0)"}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-window" style={{
          width: 380, height: 500, background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)", borderRadius: 24, border: "1px solid rgba(16, 185, 129, 0.2)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {/* Header */}
          <div style={{ padding: "20px 24px", background: "linear-gradient(90deg, #10b981 0%, #059669 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s infinite" }}></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem" }}>Binkeyit AI</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>Online & Ready to assist</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }}>×</button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.type === "bot" ? "flex-start" : "flex-end", maxWidth: "90%", width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  alignSelf: m.type === "bot" ? "flex-start" : "flex-end",
                  maxWidth: "85%", padding: "12px 16px", borderRadius: 16,
                  background: m.type === "bot" ? "white" : "var(--brand-green)",
                  color: m.type === "bot" ? "var(--text-dark)" : "white",
                  fontSize: "0.9rem", fontWeight: 500,
                  boxShadow: m.type === "bot" ? "0 2px 8px rgba(0,0,0,0.05)" : "0 4px 12px rgba(12, 131, 31, 0.2)",
                  animation: m.type === "bot" ? "fadeIn 0.3s ease" : "slideUp 0.3s ease"
                }}>
                  {m.text}
                </div>

                {/* AI Product Suggestions - Vertical List */}
                {m.products && m.products.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
                    {m.products.map(p => (
                      <div key={p._id} style={{ 
                        width: "100%", background: "white", borderRadius: 16, padding: "12px 16px", 
                        border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        display: "flex", alignItems: "center", gap: 16,
                        animation: "fadeIn 0.4s ease"
                      }}>
                        <img src={p.image?.[0] || "https://placehold.co/100"} alt={p.name} style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)" }}>{p.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4 }}>{p.unit}</div>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--brand-green)" }}>₹{priceAfterDiscount(p.price, p.discount)}</div>
                        </div>
                        <button 
                          onClick={() => updateItemQty(p._id, getCartItemId(p._id), getQty(p._id) + 1)}
                          style={{ 
                            background: getQty(p._id) > 0 ? "white" : "var(--brand-green)", 
                            color: getQty(p._id) > 0 ? "var(--brand-green)" : "white", 
                            border: getQty(p._id) > 0 ? "2px solid var(--brand-green)" : "none",
                            padding: "8px 16px", borderRadius: 10, fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {getQty(p._id) > 0 ? `${getQty(p._id)} IN CART` : "ADD"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: "flex-start", background: "white", padding: "12px 16px", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <div className="typing-dot"></div>
                  <div className="typing-dot" style={{ animationDelay: "0.2s" }}></div>
                  <div className="typing-dot" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ padding: 20, background: "white", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", gap: 12, background: "#f8fafc", padding: "4px 4px 4px 16px", borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..." 
                style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: "0.9rem", color: "var(--text-dark)" }}
              />
              <button 
                type="submit"
                style={{
                  background: "var(--brand-green)", color: "white", border: "none",
                  width: 36, height: 36, borderRadius: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .typing-dot {
          width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%;
          animation: typingPulse 1.4s infinite;
        }
        @keyframes typingPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
