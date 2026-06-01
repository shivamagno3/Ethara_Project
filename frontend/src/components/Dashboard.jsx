import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  ShoppingBag, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { API_BASE_URL } from '../App';

function Dashboard({ setActiveTab, addToast }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
      addToast('Could not load dashboard stats. Make sure API is running.', 'danger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner spinner-lg"></div>
        <span>Gathering live system metrics...</span>
      </div>
    );
  }

  const data = metrics || {
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products_count: 0,
    low_stock_products: []
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>
            System Operations Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Real-time visual monitoring of stock allocations, customer reach, and order executions.
          </p>
        </div>
        
        <button 
          onClick={() => fetchMetrics(true)} 
          disabled={refreshing}
          className="btn btn-secondary"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Sync Now'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <div className="card" onClick={() => setActiveTab('products')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Products</span>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>{data.total_products}</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} /> Active SKUs
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <Package size={20} />
          </div>
        </div>

        <div className="card" onClick={() => setActiveTab('customers')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Registered Customers</span>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>{data.total_customers}</h2>
            <span style={{ fontSize: '0.7rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} /> Registered Clients
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
            <Users size={20} />
          </div>
        </div>

        <div className="card" onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total Orders</span>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>{data.total_orders}</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} /> Complete Logs
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Critical Warnings</span>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '8px 0 4px 0' }}>{data.low_stock_products_count}</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> Requires Restock (&lt;10 items)
            </span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}>
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600 }}>Critical Stock Refills Needed</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Items falling below the safe inventory margin.</p>
              </div>
            </div>
            {data.low_stock_products_count > 0 && (
              <span className="badge badge-danger">{data.low_stock_products_count} Warnings</span>
            )}
          </div>

          {data.low_stock_products.length === 0 ? (
            <div style={{ border: '1px dashed var(--border-color)', padding: 32, borderRadius: 12, textAlignment: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>🎉</span>
              <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>All stocks fully loaded!</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.775rem' }}>Every single SKU is operating within healthy margins.</p>
            </div>
          ) : (
            <div className="table-container">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th>SKU Code</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Stock Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.low_stock_products.map((prod) => (
                      <tr key={prod.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.product_name}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '2px 6px', background: 'var(--bg-main)', borderRadius: 4, border: '1px solid var(--border-color)' }}>
                            {prod.sku}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>${Number(prod.price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${prod.quantity_in_stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                            {prod.quantity_in_stock} remaining
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Gauge size={20} style={{ color: 'var(--color-primary)' }} />
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 600 }}>System Actions</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Quick management entry points.</p>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Easily update stocks, review clients CRM records, or process orders in an instant.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button 
              onClick={() => setActiveTab('products')} 
              className="btn btn-secondary"
              style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={16} style={{ color: 'var(--color-primary)' }} /> Restock Products
              </span>
              <ArrowRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('customers')} 
              className="btn btn-secondary"
              style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} style={{ color: '#8b5cf6' }} /> Add New Customers
              </span>
              <ArrowRight size={16} />
            </button>

            <button 
              onClick={() => setActiveTab('orders')} 
              className="btn btn-primary"
              style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff' }}>
                <ShoppingBag size={16} /> Draft New Order
              </span>
              <ArrowRight size={16} style={{ color: '#ffffff' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;