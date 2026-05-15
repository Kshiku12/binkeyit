import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import ProductCard from "../components/ProductCard";

export default function ProductListPage() {
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const categoryId = params.get("categoryId");
  const subCategoryId = params.get("subCategoryId");

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
      if (!categoryId) {
        const res = await api.post("/api/v2/catalog/products/list", { page: 1, limit: 30 });
        setItems(deduplicateProducts(res.data.data || []));
        return;
      }
      
      const payload = { categoryId, page: 1, limit: 30 };
      let endpoint = "/api/v2/catalog/products/by-category";

      if (subCategoryId) {
        payload.subCategoryId = subCategoryId;
        endpoint = "/api/v2/catalog/products/by-category-subcategory";
      }

      const res = await api.post(endpoint, payload);
      setItems(res.data.data || []);
    };
    load().catch(console.error);
  }, [categoryId, subCategoryId]);

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <h2>Products</h2>
      <div className="product-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginTop: 16 }}>
        {items.map((item) => (
          <ProductCard key={item._id} item={item} />
        ))}
      </div>
      {!items.length && <p className="small">No products found.</p>}
    </div>
  );
}
