import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../state/CartContext";
import { api } from "../api/client";

const priceAfterDiscount = (price = 0, discount = 0) => {
  const off = Math.ceil((Number(price) * Number(discount || 0)) / 100);
  return Number(price) - off;
};

const generateDeterministicNumber = (str, min, max, isFloat = false) => {
  if (!str) return min;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const random = Math.abs(Math.sin(hash));
  if (isFloat) {
    return (random * (max - min) + min).toFixed(1);
  }
  return Math.floor(random * (max - min + 1)) + min;
};

export default function ProductCard({ item: baseItem, asRow = false }) {
  const { getQty, getCartItemId, updateItemQty } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(4.5);
  const [reviews, setReviews] = useState(120);
  const [deliveryTime, setDeliveryTime] = useState(10);
  
  // Track the currently selected item (variant)
  const [currentItem, setCurrentItem] = useState(baseItem);
  const [variants, setVariants] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const qty = currentItem?._id ? getQty(currentItem._id) : 0;
  const cartItemId = currentItem?._id ? getCartItemId(currentItem._id) : null;

  useEffect(() => {
    if (!currentItem?._id) return;
    setRating(generateDeterministicNumber(currentItem._id, 4.1, 4.9, true));
    setReviews(generateDeterministicNumber(currentItem._id, 80, 850));
    setDeliveryTime(generateDeterministicNumber(currentItem._id + "time", 4, 9));
  }, [currentItem?._id]);

  useEffect(() => {
    if (showModal) {
      // Fetch variants when modal opens
      const fetchVariants = async () => {
        try {
          const res = await api.post("/api/v2/catalog/products/list", { search: currentItem.name, limit: 50 });
          if (res.data?.success) {
            // Strictly filter by exact name match to find true variants
            const exactMatches = res.data.data.filter(p => p.name === currentItem.name);
            // Sort by price so smaller units appear first
            setVariants(exactMatches.sort((a, b) => a.price - b.price));
          }
        } catch (e) {
          console.error("Failed to fetch variants", e);
        }
      };
      fetchVariants();
    } else {
      // Reset when closed
      setActiveImageIndex(0);
    }
  }, [showModal, currentItem.name]);

  const handleAdd = (e) => {
    e.stopPropagation();
    updateItemQty(currentItem._id, cartItemId, qty + 1);
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    updateItemQty(currentItem._id, cartItemId, qty - 1);
  };

  const finalPrice = priceAfterDiscount(currentItem.price, currentItem.discount);

  // Render Image Carousel
  const renderImages = () => {
    const images = currentItem.image && currentItem.image.length > 0 ? currentItem.image : ["https://placehold.co/300"];
    
    return (
      <div className="pm-image-section">
        <div className="pm-image-main">
          <img src={images[activeImageIndex]} alt={currentItem.name} />
        </div>
        {images.length > 1 && (
          <div className="pm-image-thumbnails">
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className={`pm-thumbnail ${idx === activeImageIndex ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
              >
                <img src={img} alt={`${currentItem.name} ${idx}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {asRow ? (
        <div className="search-result-row" onClick={() => setShowModal(true)}>
          <div className="search-row-img-container">
            <img src={baseItem.image?.[0] || "https://placehold.co/150"} alt={baseItem.name} />
          </div>
          <div className="search-row-info">
            <div className="search-row-title">{baseItem.name}</div>
            <div className="search-row-unit">{baseItem.unit}</div>
            <div className="search-row-price-section">
              <span className="search-row-price">₹{priceAfterDiscount(baseItem.price, baseItem.discount)}</span>
              {baseItem.discount > 0 && (
                <span className="search-row-mrp">₹{baseItem.price}</span>
              )}
            </div>
          </div>
          <div className="search-row-action">
            {getQty(baseItem._id) === 0 ? (
              <button className="add-button" onClick={(e) => { e.stopPropagation(); updateItemQty(baseItem._id, getCartItemId(baseItem._id), 1); }}>
                ADD +
              </button>
            ) : (
              <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateItemQty(baseItem._id, getCartItemId(baseItem._id), getQty(baseItem._id) - 1); }}>-</button>
                <span style={{ padding: "0 6px", fontWeight: 700, fontSize: "0.85rem" }}>{getQty(baseItem._id)}</span>
                <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateItemQty(baseItem._id, getCartItemId(baseItem._id), getQty(baseItem._id) + 1); }}>+</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="product-card" onClick={() => setShowModal(true)} style={{ cursor: "pointer" }}>
          <div style={{ 
            position: "absolute", 
            top: 12, 
            left: 12, 
            background: "var(--bg-color)", 
            color: "var(--text-dark)",
            fontSize: "0.6rem", 
            padding: "4px 6px", 
            borderRadius: 4, 
            fontWeight: 700, 
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)", 
            zIndex: 10 
          }}>
            ⏱️ {deliveryTime} MINS
          </div>

          <div className="product-image-container">
            <img src={baseItem.image?.[0] || "https://placehold.co/150"} alt={baseItem.name} />
          </div>
          
          <div className="product-title">{baseItem.name}</div>
          <div className="product-unit">{baseItem.unit}</div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-dark)" }}>₹{priceAfterDiscount(baseItem.price, baseItem.discount)}</span>
              {baseItem.discount > 0 && (
                <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "0.75rem" }}>₹{baseItem.price}</span>
              )}
            </div>
            
            {getQty(baseItem._id) === 0 ? (
              <button className="add-button" onClick={(e) => { e.stopPropagation(); updateItemQty(baseItem._id, getCartItemId(baseItem._id), 1); }}>
                ADD +
              </button>
            ) : (
              <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateItemQty(baseItem._id, getCartItemId(baseItem._id), getQty(baseItem._id) - 1); }}>-</button>
                <span style={{ padding: "0 6px", fontWeight: 700, fontSize: "0.85rem" }}>{getQty(baseItem._id)}</span>
                <button className="qty-btn" onClick={(e) => { e.stopPropagation(); updateItemQty(baseItem._id, getCartItemId(baseItem._id), getQty(baseItem._id) + 1); }}>+</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && createPortal(
        <div className="pm-overlay" onClick={() => setShowModal(false)}>
          <div className="pm-content" onClick={(e) => e.stopPropagation()}>
            <button className="pm-close" onClick={() => setShowModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            {renderImages()}
            
            <div className="pm-body">
              <h2 className="pm-title">{currentItem.name}</h2>
              <div className="pm-unit">{currentItem.unit}</div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                <div className="pm-rating-badge">
                  {rating} 
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
                <div className="pm-reviews">{reviews} verified ratings</div>
              </div>

              {variants.length > 1 && (
                <div className="pm-variants-section">
                  <div className="pm-section-title">Select Quantity</div>
                  <div className="pm-variants-grid">
                    {variants.map(v => (
                      <div 
                        key={v._id} 
                        className={`pm-variant-pill ${v._id === currentItem._id ? 'active' : ''}`}
                        onClick={() => { setCurrentItem(v); setActiveImageIndex(0); }}
                      >
                        <div className="pm-variant-unit">{v.unit}</div>
                        <div className="pm-variant-price">₹{priceAfterDiscount(v.price, v.discount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pm-delivery-badge" style={{ marginTop: "16px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Superfast Delivery in {deliveryTime} minutes
              </div>

              <div className="pm-details-section">
                <div className="pm-section-title">Product Details</div>
                <p className="pm-desc">{currentItem.description}</p>
                
                {currentItem.moreDetails && Object.keys(currentItem.moreDetails).length > 0 && (
                  <div className="pm-specs-grid">
                    {Object.entries(currentItem.moreDetails).map(([key, value]) => (
                      <div className="pm-spec-row" key={key}>
                        <div className="pm-spec-key">{key}</div>
                        <div className="pm-spec-val">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pm-footer" style={{ marginTop: "24px" }}>
                <div className="pm-price-block">
                  <div className="pm-price">₹{finalPrice}</div>
                  {currentItem.discount > 0 && <div className="pm-mrp">MRP ₹{currentItem.price}</div>}
                  <div style={{ fontSize: "0.75rem", color: "var(--brand-green)", fontWeight: 700 }}>Inclusive of all taxes</div>
                </div>

                {qty === 0 ? (
                  <button className="pm-add-btn" onClick={handleAdd}>
                    Add to Cart
                  </button>
                ) : (
                  <div className="pm-qty-control">
                    <button className="pm-qty-btn" onClick={handleMinus}>−</button>
                    <div className="pm-qty-text">{qty}</div>
                    <button className="pm-qty-btn" onClick={handleAdd}>+</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
