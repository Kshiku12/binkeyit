import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const deduplicateProducts = (items) => {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
};

export default function HomePage() {
  const [data, setData] = useState({ categories: [], sections: [], banner: null });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/v2/catalog/home");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Home load error:", err);
      }
    };
    load();
  }, []);

  const firstSectionLink = useMemo(() => {
    if (!data.sections || data.sections.length === 0) return "/search";
    const firstSection = data.sections.find((s) => s.items && s.items.length > 0);
    if (!firstSection) return "/search";
    
    const category = firstSection.category;
    if (!category || !category._id) return "/search";
    
    const firstItem = firstSection.items[0];
    const subId = firstItem?.subCategory?.[0] || "";
    return `/products?categoryId=${category._id}&subCategoryId=${subId}`;
  }, [data.sections]);

  return (
    <div className="container">
      <section 
        className="banner futuristic-banner" 
        style={{ 
          backgroundImage: `url(${data.banner?.image || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "350px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          borderRadius: "24px",
          padding: "40px",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      >
        <div className="banner-content" style={{ 
          background: "rgba(0, 0, 0, 0.4)", 
          backdropFilter: "blur(12px)", 
          padding: "32px", 
          borderRadius: "20px", 
          maxWidth: "500px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
        }}>
          <h1 style={{ color: "white", fontSize: "3rem", marginBottom: "12px", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{data.banner?.title || "Electronics Store"}</h1>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.2rem", marginBottom: "24px", fontWeight: 500 }}>{data.banner?.subtitle || "Your favourite iPhone now delivered in minutes"}</p>
          <button 
            className="btn btn-primary" 
            style={{ padding: "14px 32px", fontSize: "1.1rem", borderRadius: "12px", boxShadow: "0 10px 20px rgba(16, 185, 129, 0.3)" }}
            onClick={() => navigate("/products?categoryId=69e853843335d392402a5399")}
          >
            Shop Now
          </button>
        </div>
      </section>

      <section className="category-grid" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, paddingTop: 16, flexWrap: "nowrap", WebkitOverflowScrolling: "touch" }}>
        {data.categories?.map((cat) => (
          <Link 
            to={`/products?categoryId=${cat._id}`} 
            key={cat._id} 
            className="category-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: 'var(--text-dark)', 
              minWidth: 120, 
              background: 'var(--card-bg)', 
              padding: 16, 
              borderRadius: 12, 
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)", 
              border: "1px solid var(--border-color)" 
            }}
          >
            <img src={cat.image || "https://placehold.co/64x64"} alt={cat.name} style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}>{cat.name}</div>
          </Link>
        ))}
      </section>

      {data.sections?.map((section) => {
        const uniqueItems = deduplicateProducts(section.items || []);
        if (uniqueItems.length === 0) return null;
        
        const cat = section.category;
        const sample = section.items?.[0];
        const subId = sample?.subCategory?.[0];
        const seeAllLink = `/products?categoryId=${cat._id}&subCategoryId=${subId || ""}`;

        return (
          <section key={cat._id} style={{ marginBottom: 32 }}>
            <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ color: "var(--text-dark)", margin: 0 }}>{cat.name}</h2>
              <Link to={seeAllLink} style={{ color: "var(--brand-green)", fontWeight: 800, textDecoration: "none", fontSize: "0.9rem" }}>
                See All
              </Link>
            </div>
            <div className="product-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {uniqueItems.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
