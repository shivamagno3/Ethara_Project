import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  Database,
  Zap
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import CustomerManager from './components/CustomerManager';
import OrderManager from './components/OrderManager';
import ErrorBoundary from './components/ErrorBoundary';

export const API_BASE_URL = import.meta.env.VITE_API_URL ;

const NAV_ITEMS = [
  { key: 'dashboard',  label: 'Dashboard',         Icon: LayoutDashboard },
  { key: 'products',   label: 'Product Inventory',  Icon: Package },
  { key: 'customers',  label: 'Customers CRM',      Icon: Users },
  { key: 'orders',     label: 'Orders Registry',    Icon: ShoppingBag },
];

function App() {
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [sidebarOpen, setSidebar]   = useState(true);
  const [toasts, setToasts]         = useState([]);
  const [mobile, setMobile]         = useState(false);

  /* ── responsive ── */
  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 1024;
      setMobile(isMobile);
      setSidebar(!isMobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── toasts ── */
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };

  const navigate = (key) => {
    setActiveTab(key);
    if (mobile) setSidebar(false);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard setActiveTab={setActiveTab} addToast={addToast} />;
      case 'products':   return <ProductManager addToast={addToast} />;
      case 'customers':  return <CustomerManager addToast={addToast} />;
      case 'orders':     return <OrderManager addToast={addToast} />;
      default:           return <Dashboard setActiveTab={setActiveTab} addToast={addToast} />;
    }
  };

  return (
    <ErrorBoundary>
      {/* ── Toast stack ── */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
          >
            {t.type === 'success'
              ? <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              : <AlertCircle size={18} style={{ color: 'var(--color-danger)',  flexShrink: 0 }} />
            }
            <span className="toast-message">{t.message}</span>
            <X size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* ── Root shell ── */}
      <div className="app-shell">

        {/* ════ HEADER ════ */}
        <header className="app-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebar(o => !o)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="brand">
              <div className="brand-icon">
                <Zap size={16} />
              </div>
              <span className="brand-name">
                NEXUS
                <span className="brand-badge">IMS</span>
              </span>
            </div>
          </div>

          <div className="header-right">
            <div className="status-pill">
              <span className="status-dot" />
              System Live
            </div>
          </div>
        </header>

        {/* ════ BODY (sidebar + main) ════ */}
        <div className="app-body">

          {/* Mobile overlay */}
          {mobile && sidebarOpen && (
            <div
              className="sidebar-overlay"
              onClick={() => setSidebar(false)}
            />
          )}

          {/* ── SIDEBAR ── */}
          <aside className={`app-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
            <nav className="sidebar-nav">
              {NAV_ITEMS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`nav-item${activeTab === key ? ' nav-item-active' : ''}`}
                  onClick={() => navigate(key)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="db-card">
                <div className="db-card-header">
                  <Database size={14} />
                  <span>PostgreSQL</span>
                </div>
                <p className="db-card-text">
                  Multi-service container with relational SQL architecture.
                </p>
              </div>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="app-main">
            <div className="page-content">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;