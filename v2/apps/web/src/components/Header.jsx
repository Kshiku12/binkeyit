import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import ProductCard from "./ProductCard";

const SEARCH_TERMS = ["milk", "bread", "butter", "paneer", "chips", "cold drinks"];

export default function Header() {
  const [q, setQ] = useState("");
  const [user, setUser] = useState(null);
  const [placeholder, setPlaceholder] = useState(`Search "milk"`);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Typewriter effect for placeholder
  useEffect(() => {
    let termIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const type = () => {
      const currentTerm = SEARCH_TERMS[termIndex];
      
      if (isDeleting) {
        setPlaceholder(`Search "${currentTerm.substring(0, charIndex)}"`);
        charIndex--;
      } else {
        setPlaceholder(`Search "${currentTerm.substring(0, charIndex)}"`);
        charIndex++;
      }

      let typingSpeed = isDeleting ? 50 : 150;

      if (!isDeleting && charIndex === currentTerm.length + 1) {
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        termIndex = (termIndex + 1) % SEARCH_TERMS.length;
        typingSpeed = 500;
      }

      timeoutId = setTimeout(type, typingSpeed);
    };

    timeoutId = setTimeout(type, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("v2_access_token");
        if (!token) {
          setUser(null);
          return;
        }
        const res = await api.get("/api/v2/auth/me");
        setUser(res.data.data);
      } catch (err) {
        localStorage.removeItem("v2_access_token");
        setUser(null);
        window.dispatchEvent(new Event("auth_change"));
      }
    };
    
    fetchUser();

    window.addEventListener("auth_change", fetchUser);
    return () => window.removeEventListener("auth_change", fetchUser);
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.post("/api/v2/catalog/products/list", { search: q, limit: 6 });
        if (res.data?.success) {
          // Filter to unique base items to avoid showing 10 variants of atta
          const uniqueItems = [];
          const seenNames = new Set();
          for (const item of res.data.data) {
            if (!seenNames.has(item.name)) {
              seenNames.add(item.name);
              uniqueItems.push(item);
            }
          }
          setSearchResults(uniqueItems);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [q]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  const handleLogout = async () => {
    try {
      await api.post("/api/v2/auth/logout");
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("v2_access_token");
    setUser(null);
    window.dispatchEvent(new Event("auth_change"));
    navigate("/");
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link className="brand" to="/">
          Binkeyit
        </Link>
        <div className="search-container" ref={dropdownRef}>
          <form onSubmit={onSubmit} style={{ display: "flex", width: "100%" }}>
            <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
              <svg style={{ position: "absolute", left: 16, color: "var(--text-muted)", width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                className="search"
                style={{ paddingLeft: 44, borderRadius: showDropdown ? "12px 12px 0 0" : "12px" }}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                placeholder={placeholder}
              />
            </div>
          </form>
          
          {showDropdown && (
            <div className="search-dropdown">
              {isSearching ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>Searching...</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="search-dropdown-list">
                    {searchResults.map((item) => (
                      <ProductCard key={item._id} item={item} asRow={true} />
                    ))}
                  </div>
                  <div 
                    className="search-dropdown-footer" 
                    onClick={onSubmit}
                  >
                    See all results for "{q}"
                  </div>
                </>
              ) : (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>No products found</div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginLeft: "1rem" }}>
          {user ? (
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <Link to="/profile" className="header-wallet-badge" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "6px 12px", borderRadius: "10px", display: "flex", gap: "8px", alignItems: "center", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="3"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  <span style={{ fontWeight: 800, color: "var(--brand-green)" }}>₹{user.walletBalance?.toLocaleString() || "0"}</span>
                </div>
              </Link>
              <Link to="/profile" style={{ textDecoration: "none", color: "inherit", fontWeight: 700, fontSize: "0.95rem" }}>
                Hi, {user?.name?.split(" ")[0] || "User"}
              </Link>
              <button onClick={handleLogout} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.9rem" }}>Logout</button>
            </div>
          ) : (
            <Link to="/login" style={{ fontWeight: 700, color: "var(--text-dark)" }}>Login</Link>
          )}

          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Dark Mode">
            {theme === "light" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
          </button>
          
          <Link to="/cart">
            <button className="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              My Cart
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
