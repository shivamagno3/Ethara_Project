import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, X, Users, Mail, Phone, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../App';
import ConfirmModal from './ConfirmModal';

function CustomerManager({ addToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, id: null, name: '' });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers`);
      if (!response.ok) throw new Error();
      setCustomers(await response.json());
    } catch {
      addToast('Error retrieving customers database. Verify API status.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAddDrawer = () => {
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) return addToast('Full name is required', 'danger');
    if (!email.trim()) return addToast('Email is required', 'danger');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return addToast('Please enter a valid email address', 'danger');
    }

    setSubmitting(true);

    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phoneNumber.trim() || null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'API request failed');

      addToast(`Customer "${payload.full_name}" registered successfully.`, 'success');
      setDrawerOpen(false);
      fetchCustomers();
    } catch (err) {
      addToast(err.message || 'Registration failed. Check if email is already in use.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const { id, name } = confirm;
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Delete failed');

      addToast(`Customer "${name}" has been removed from database.`, 'success');
      setConfirm({ open: false, id: null, name: '' });
      fetchCustomers();
    } catch (err) {
      addToast(err.message || 'Cannot delete customer. Delete their associated order records first.', 'danger');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, marginBottom: 4 }}>
            Customers CRM
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Access, structure, and regulate client profiles, contact numbers, and billing accounts.
          </p>
        </div>
        
        <button onClick={openAddDrawer} className="btn btn-primary">
          <Plus size={16} /> Add New Client
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
        <Search className="text-slate-400" size={18} style={{ flexShrink: 0 }} />
        <input 
          type="text"
          placeholder="Filter by customer full name or contact email address..."
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
          <span>Retrieving CRM directory...</span>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 16 }}>👥</span>
          <h3 className="empty-state-title">No customers found</h3>
          <p className="empty-state-desc" style={{ margin: '8px auto 16px auto' }}>
            {searchTerm 
              ? `No registered clients match "${searchTerm}"`
              : 'Your CRM database has no records. Initialize records by creating your first customer account!'
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
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Contact</th>
                  <th>Enlisted Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{cust.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span className="avatar">{cust.full_name.charAt(0).toUpperCase()}</span>
                        {cust.full_name}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                        <Mail size={13} className="text-slate-500" />
                        {cust.email}
                      </span>
                    </td>
                    <td>
                      {cust.phone_number ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                          <Phone size={13} className="text-slate-500" />
                          {cust.phone_number}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem', fontStyle: 'italic' }}>Not Provided</span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} className="text-slate-500" />
                        {new Date(cust.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => setConfirm({ open: true, id: cust.id, name: cust.full_name })}
                        className="icon-btn danger"
                        title="Delete Customer profile"
                      >
                        <Trash2 size={13} />
                      </button>
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
              <span className="drawer-title">Register Client Profile</span>
              <button 
                onClick={() => setDrawerOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body">
              <form id="form-customer" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer Full Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Shiva Prasad"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address (Unique Key)</label>
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="e.g. shiva@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    className="form-control"
                    placeholder="e.g. +91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={submitting}
                  />
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
                form="form-customer"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1 }}
              >
                {submitting ? 'Registering...' : 'Register Profile'}
              </button>
            </div>
          </aside>
        </>
      )}

      <ConfirmModal
        isOpen={confirm.open}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete the profile for "${confirm.name}"? This will permanently delete their CRM profile.`}
        confirmLabel="Yes, Delete Profile"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: '' })}
      />
    </div>
  );
}

export default CustomerManager;