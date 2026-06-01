import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, X, ShoppingBag, Eye,
  ShoppingCart, Info, Calendar, User,
} from 'lucide-react';
import { API_BASE_URL } from '../App';
import ConfirmModal from './ConfirmModal';

function OrderManager({ addToast }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomer, setSelCustomer] = useState('');
  const [cartItems, setCart] = useState([]);
  const [currentProduct, setCurProduct] = useState('');
  const [currentQty, setCurQty] = useState('1');
  const [submitting, setSub] = useState(false);

  const [viewOrder, setViewOrder] = useState(null);

  const [confirm, setConfirm] = useState({ open: false, id: null });

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch {
      addToast('Failed to load orders.', 'danger');
    }
  }, [addToast]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data);
      return data;
    } catch {
      addToast('Failed to load products.', 'danger');
      return null;
    }
  }, [addToast]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(data);
      return data;
    } catch {
      addToast('Failed to load customers.', 'danger');
      return null;
    }
  }, [addToast]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    };
    init();
  }, [fetchOrders]);

  const openCreate = async () => {
    let currentCustomers = customers;
    if (currentCustomers.length === 0) {
      const fetched = await fetchCustomers();
      if (fetched) currentCustomers = fetched;
    }

    let currentProducts = products;
    if (currentProducts.length === 0) {
      const fetched = await fetchProducts();
      if (fetched) currentProducts = fetched;
    }

    if (currentCustomers.length === 0) return addToast('Register at least one customer first.', 'danger');
    if (currentProducts.length === 0) return addToast('Add at least one product first.', 'danger');
    setSelCustomer(''); 
    setCart([]); 
    setCurProduct(''); 
    setCurQty('1');
    setCreateOpen(true);
  };

  const addToCart = () => {
    if (!currentProduct) return addToast('Please select a product.', 'danger');
    const parsedQty = parseInt(currentQty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) return addToast('Quantity must be at least 1.', 'danger');

    const product = products.find((p) => p.id === parseInt(currentProduct, 10));
    if (!product) return addToast('Product not found.', 'danger');

    if (product.quantity_in_stock < parsedQty) {
      return addToast(`"${product.product_name}" only has ${product.quantity_in_stock} in stock.`, 'danger');
    }

    const existing = cartItems.findIndex((i) => i.product_id === product.id);
    if (existing > -1) {
      const newQty = cartItems[existing].quantity + parsedQty;
      if (product.quantity_in_stock < newQty) {
        return addToast(`Combined qty (${newQty}) exceeds stock (${product.quantity_in_stock}).`, 'danger');
      }
      const updated = [...cartItems];
      updated[existing] = { ...updated[existing], quantity: newQty };
      setCart(updated);
    } else {
      setCart([...cartItems, {
        product_id: product.id,
        product_name: product.product_name,
        price: Number(product.price),
        stock: product.quantity_in_stock,
        quantity: parsedQty,
      }]);
    }
    setCurProduct(''); 
    setCurQty('1');
  };

  const removeFromCart = (idx) => setCart(cartItems.filter((_, i) => i !== idx));

  const cartTotal = () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return addToast('Select a customer.', 'danger');
    if (cartItems.length === 0) return addToast('Cart is empty.', 'danger');

    setSub(true);
    const payload = {
      customer_id: parseInt(selectedCustomer, 10),
      items: cartItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    };
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to place order');
      addToast(`Order #${data.id} placed successfully.`, 'success');
      setCreateOpen(false);
      fetchOrders();
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Order failed — check stock availability.', 'danger');
    } finally {
      setSub(false);
    }
  };

  const inspectOrder = async (id) => {
    const localOrder = orders.find((o) => o.id === id);
    if (localOrder && localOrder.items) {
      setViewOrder(localOrder);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`);
      if (!res.ok) throw new Error();
      setViewOrder(await res.json());
    } catch {
      addToast('Could not fetch order items.', 'danger');
    }
  };

  const handleCancelOrder = async () => {
    const id = confirm.id;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to cancel order.');
      addToast(`Order #${id} cancelled. Stock restored.`, 'success');
      setViewOrder(null);
      setConfirm({ open: false, id: null });
      fetchOrders();
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Cancellation failed.', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>Orders</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Process orders, review invoices, and manage cancellations.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="btn-new-order">
          <Plus size={16} /> New Order
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <span>Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 16 }}>🧾</span>
          <h3 className="empty-state-title">No orders yet</h3>
          <p className="empty-state-desc" style={{ margin: '8px auto 16px auto' }}>
            Create your first order by clicking "New Order" above.
          </p>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>New Order</button>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <span className="badge badge-blue">#{o.id}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span className="avatar">{o.customer_name?.charAt(0) ?? '?'}</span>
                        {o.customer_name}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} className="text-slate-500" />
                        {new Date(o.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {o.items ? `${o.items.length} item${o.items.length !== 1 ? 's' : ''}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-success)' }}>
                      ${Number(o.total_amount).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="icon-btn primary"
                        title="View order"
                        onClick={() => inspectOrder(o.id)}
                        id={`btn-view-order-${o.id}`}
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setCreateOpen(false)} />
          <aside className="drawer" style={{ maxWidth: 600 }}>
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingCart size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="drawer-title">Create New Order</span>
              </div>
              <button className="icon-btn" onClick={() => setCreateOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="form-order" onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ padding: 16, backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    1. Select Customer
                  </div>
                  <select
                    className="form-control"
                    value={selectedCustomer}
                    onChange={(e) => setSelCustomer(e.target.value)}
                    disabled={submitting}
                    required
                    id="select-customer"
                  >
                    <option value="">— Choose a customer —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                <div style={{ padding: 16, backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                    2. Add Products
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      className="form-control"
                      value={currentProduct}
                      onChange={(e) => setCurProduct(e.target.value)}
                      disabled={submitting}
                      id="select-product"
                    >
                      <option value="">— Select a product —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                          {p.product_name} — ${Number(p.price).toFixed(2)}
                          {p.quantity_in_stock === 0 ? ' [Out of stock]' : ` (${p.quantity_in_stock} left)`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      placeholder="Qty"
                      value={currentQty}
                      onChange={(e) => setCurQty(e.target.value)}
                      disabled={submitting}
                      id="input-cart-qty"
                      style={{ width: 80, textAlign: 'center' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={addToCart}
                      disabled={submitting}
                      id="btn-add-to-cart"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    3. Order Items
                    {cartItems.length > 0 && (
                      <span className="badge badge-blue">
                        {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.825rem', border: '1px dashed var(--border-color)', borderRadius: 8, background: '#f8fafc' }}>
                      No items added yet. Select a product above.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cartItems.map((item, idx) => (
                        <div className="cart-item" key={idx} id={`cart-item-${idx}`}>
                          <div>
                            <div className="cart-item-name">{item.product_name}</div>
                            <div className="cart-item-meta">
                              ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => removeFromCart(idx)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}

                      <div className="order-total-row">
                        <span className="order-total-label">Order Total</span>
                        <span className="order-total-value">${cartTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="drawer-footer">
              <button className="btn btn-secondary" onClick={() => setCreateOpen(false)} disabled={submitting} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                form="form-order"
                type="submit"
                disabled={submitting || cartItems.length === 0 || !selectedCustomer}
                id="btn-place-order"
                style={{ flex: 1 }}
              >
                {submitting ? 'Placing Order…' : `Place Order — $${cartTotal().toFixed(2)}`}
              </button>
            </div>
          </aside>
        </>
      )}

      {viewOrder && (
        <>
          <div className="drawer-overlay" onClick={() => setViewOrder(null)} />
          <aside className="drawer">
            <div className="drawer-header">
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 2 }}>
                  Order Receipt
                </div>
                <span className="drawer-title">Order #{viewOrder.id}</span>
              </div>
              <button className="icon-btn" onClick={() => setViewOrder(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card" style={{ padding: '4px 16px' }}>
                <div className="kv-row">
                  <span className="kv-label">Order Reference</span>
                  <span className="kv-value font-mono">#{viewOrder.id}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Customer</span>
                  <span className="kv-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="avatar">{viewOrder.customer_name?.charAt(0) ?? '?'}</span>
                    {viewOrder.customer_name}
                  </span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Date Placed</span>
                  <span className="kv-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} className="text-slate-500" />
                    {new Date(viewOrder.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Line Items
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewOrder.items || []).map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.product_name}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>${Number(item.unit_price).toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="badge badge-neutral">{item.quantity}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                            ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="order-total-row" style={{ border: '1px solid var(--border-color)' }}>
                <span className="order-total-label">Grand Total</span>
                <span className="order-total-value" style={{ fontSize: '1.25rem' }}>
                  ${Number(viewOrder.total_amount).toFixed(2)}
                </span>
              </div>

              <div className="info-box">
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>Cancelling this order will automatically restore all item quantities back to stock.</span>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                className="btn btn-danger"
                onClick={() => setConfirm({ open: true, id: viewOrder.id })}
                id="btn-cancel-order"
                style={{ flex: 1 }}
              >
                <Trash2 size={16} /> Cancel Order
              </button>
              <button className="btn btn-secondary" onClick={() => setViewOrder(null)} style={{ flex: 1 }}>
                Close
              </button>
            </div>
          </aside>
        </>
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title="Cancel Order"
        message={`Cancel order #${confirm.id}? All item quantities will be restored to stock. This cannot be undone.`}
        confirmLabel="Yes, Cancel Order"
        onConfirm={handleCancelOrder}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
}

export default OrderManager;