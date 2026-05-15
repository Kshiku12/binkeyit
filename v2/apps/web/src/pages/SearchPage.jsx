import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import ProductCard from "../components/ProductCard";

export default function SearchPage() {
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const q = params.get("q") || "";

  const deduplicateProducts = (items) => {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  };

  useEffect(() => {
    const load = async () => {
      const payload = q ? { search: q, page: 1, limit: 40 } : { page: 1, limit: 40 };
      const res = await api.post("/api/v2/catalog/products/list", payload);
      setItems(deduplicateProducts(res.data.data || []));
    };
    load().catch(console.error);
  }, [q]);

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>
      <h2 style={{ marginBottom: 4 }}>Search Results</h2>
      <p className="small" style={{ marginBottom: 20 }}>Query: {q || "all products"}</p>
      
      <div className="product-grid">
        {items.map((item) => (
          <ProductCard key={item._id} item={item} />
        ))}
      </div>
      
      {!items.length && <p className="small">No products found for "{q}".</p>}
    </div>
  );
}
