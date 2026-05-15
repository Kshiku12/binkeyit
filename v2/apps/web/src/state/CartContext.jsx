import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
    window.addEventListener("cart_change", fetchCart);
    return () => window.removeEventListener("cart_change", fetchCart);
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get("/api/v2/cart");
      // Filter out items whose product no longer exists in the database
      const validItems = (res.data.data || []).filter(item => item.productId != null);
      setCart(validItems);
    } catch (e) {
      console.error("Failed to fetch cart", e);
    } finally {
      setLoading(false);
    }
  };

  const updateItemQty = async (productId, currentCartItemId, newQty) => {
    try {
      if (newQty <= 0) {
        if (currentCartItemId) {
          await api.delete("/api/v2/cart", { data: { itemId: currentCartItemId } });
        }
      } else {
        await api.post("/api/v2/cart", { productId, quantity: newQty });
      }
      fetchCart(); 
    } catch (e) {
      console.error("Update cart failed", e);
    }
  };

  const getQty = (productId) => {
    const item = cart.find(c => c.productId?._id === productId || c.productId === productId);
    return item ? item.quantity : 0;
  };

  const getCartItemId = (productId) => {
    const item = cart.find(c => c.productId?._id === productId || c.productId === productId);
    return item ? item._id : null;
  };

  const cartTotal = cart.reduce((acc, curr) => {
    const price = curr.productId?.price || 0;
    const discount = curr.productId?.discount || 0;
    const finalPrice = price - Math.ceil((price * discount) / 100);
    return acc + (finalPrice * curr.quantity);
  }, 0);

  const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, updateItemQty, getQty, getCartItemId, cartTotal, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};
