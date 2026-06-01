import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package } from 'lucide-react';
import { API_BASE_URL } from '../App';
import ConfirmModal from './ConfirmModal';

function ProductManager({ addToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantityInStock, setQuantityInStock] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, id: null, name: '' });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) throw new Error();
      setProducts(await response.json());
    } catch {
      addToast('Error loading products. Check your API server.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddDrawer = () => {
    setEditProduct(null);
    setProductName('');
    setSku('');
    setPrice('');
    setQuantityInStock('');
    setDrawerOpen(true);
  };

  const openEditDrawer = (prod) => {
    setEditProduct(prod);
    setProductName(prod.product_name);
    setSku(prod.sku);
    setPrice(Number(prod.price).toString());
    setQuantityInStock(prod.quantity_in_stock.toString());
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productName.trim()) return addToast('Product name is required', 'danger');
    if (!sku.trim()) return addToast('SKU is required', 'danger');
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return addToast('Price must be greater than 0', 'danger');
    }

    const parsedQty = parseInt(quantityInStock, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return addToast('Quantity cannot be negative', 'danger');
    }

    setSubmitting(true);

    const payload = {
      product_name: productName.trim(),
      price: parsedPrice,
      quantity_in_stock: parsedQty
    };

    if (!editProduct) {
      payload.sku = sku.trim().toUpperCase();
    }

    try {
      const url = editProduct 
        ? `${API_BASE_URL}/products/${editProduct.id}` 
        : `${API_BASE_URL}/products`;
      const method = editProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'API Error');

      addToast(
        editProduct 
          ? `Product "${payload.product_name}" updated successfully.` 
          : `Product "${payload.product_name}" added successfully.`,
        'success'
      );
      
      setDrawerOpen(false);
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Operation failed. Verify database SKU uniqueness.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const { id, name } = confirm;
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Delete failed');

      addToast(`Product "${name}" deleted.`, 'success');
      setConfirm({ open: false, id: null, name: '' });
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Delete failed. Product may be linked to existing orders.', 'danger');
    }
  };

  const filteredProducts = products.filter(prod => 
    prod.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prod.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>
            Product Inventory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Maintain catalogs, set wholesale pricing, assign SKUs, and monitor real-time stock levels.
          </p>
        </div>
        
        <button onClick={openAddDrawer} className="btn btn-primary">
          <Plus size={16} /> Add New SKU
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
        <Search className="text-slate-400" size={18} style={{ flexShrink: 0 }} />
        <input 
          type="text"
          placeholder="Filter by product title or SKU code..."
          style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.875rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <span>Retrieving product logs...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 16 }}>📦</span>
          <h3 className="empty-state-title">No products found</h3>
          <p className="empty-state-desc" style={{ margin: '8px auto 16px auto' }}>
            {searchTerm 
              ? `No catalog listings match "${searchTerm}"`
              : 'Your inventory catalog is currently empty. Get started by entering your first product SKU!'
            }
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="btn btn-secondary btn-sm">Clear Filter</button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Stock Level</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{prod.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.product_name}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '2px 6px', background: '#eff6ff', borderRadius: 4, border: '1px solid #bfdbfe', color: '#2563eb', fontWeight: 600 }}>
                        {prod.sku}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      ${Number(prod.price).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${
                        prod.quantity_in_stock === 0 
                          ? 'badge-danger' 
                          : prod.quantity_in_stock < 10 
                          ? 'badge-warning' 
                          : 'badge-success'
                      }`}>
                        {prod.quantity_in_stock} in stock
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button 
                          onClick={() => openEditDrawer(prod)}
                          className="icon-btn primary"
                          title="Edit details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button 
                          onClick={() => setConfirm({ open: true, id: prod.id, name: prod.product_name })}
                          className="icon-btn danger"
                          title="Delete product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer">
            <div className="drawer-header">
              <span className="drawer-title">
                {editProduct ? 'Edit Product Parameters' : 'Register New Inventory SKU'}
              </span>
              <button 
                onClick={() => setDrawerOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="form-product" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Product Name / Title</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Premium Workspace Leather Deskmat"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. MAT-LTHR-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={submitting || !!editProduct}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                  {!editProduct && (
                    <p style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      Must be unique. Recommended: AAA-BBB-00
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Unit Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      placeholder="29.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantity in Stock</label>
                    <input 
                      type="number" 
                      min="0"
                      step="1"
                      className="form-control"
                      placeholder="100"
                      value={quantityInStock}
                      onChange={(e) => setQuantityInStock(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="drawer-footer">
              <button 
                type="button" 
                onClick={() => setDrawerOpen(false)}
                className="btn btn-secondary"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="form-product"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Saving...' : editProduct ? 'Apply Changes' : 'Initialize SKU'}
              </button>
            </div>
          </aside>
        </>
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title="Delete Product"
        message={`Are you absolutely sure you want to delete product "${confirm.name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete Product"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: '' })}
      />
    </div>
  );
}

export default ProductManager;