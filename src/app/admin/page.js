"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../lib/StoreContext';

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';

export default function AdminDashboard() {
  const { showToast } = useStore();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Track previous order count to play sound
  const prevOrderCountRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Create audio element for the "Ding"
    // Using a light, classic bell sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/n8n/admin-orders');
      if (res.ok) {
        const data = await res.json();
        const orderList = data[0]?.orders || [];
        setOrders(orderList);
        
        // If we have more orders than before, play ding
        if (orderList.length > prevOrderCountRef.current && prevOrderCountRef.current !== 0) {
          audioRef.current?.play().catch(() => {});
          showToast('New array received!', 'success');
        }
        prevOrderCountRef.current = orderList.length;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (unlocked) {
      fetchOrders();
      interval = setInterval(fetchOrders, 10000); // Check every 10 seconds
    }
    return () => clearInterval(interval);
  }, [unlocked]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      showToast('Dashboard unlocked', 'success');
    } else {
      showToast('Incorrect PIN', 'error');
      setPin('');
    }
  };

  if (!unlocked) {
    return (
      <div className="admin-lock">
        <form onSubmit={handleUnlock} className="lock-box">
          <h2>Admin Dashboard</h2>
          <p>Enter PIN to view live orders</p>
          <input 
            type="password" 
            value={pin} 
            onChange={e => setPin(e.target.value)}
            placeholder="****"
            maxLength={4}
            autoFocus
          />
          <button type="submit">Unlock</button>
        </form>
        <style jsx>{`
          .admin-lock { height: 60vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
          .lock-box { background: var(--color-surface-lowest); padding: 40px; border-radius: var(--radius-lg); text-align: center; max-width: 400px; width: 100%; box-shadow: var(--shadow-card); }
          h2 { margin-bottom: 8px; font-family: var(--font-display); }
          p { color: var(--color-text-variant); margin-bottom: 24px; font-size: 0.9rem; }
          input { width: 100%; text-align: center; font-size: 2rem; letter-spacing: 12px; padding: 12px; border: 2px solid var(--color-surface-dim); border-radius: var(--radius-md); margin-bottom: 24px; background: transparent; outline: none; }
          input:focus { border-color: var(--color-primary); }
          button { background: var(--color-primary); color: white; border: none; padding: 14px; width: 100%; border-radius: var(--radius-md); font-weight: 600; font-size: 1rem; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="admin-header">
        <div>
          <h2>Live Orders {loading && <span className="loader" />}</h2>
          <p>Auto-refreshing every 10 seconds</p>
        </div>
        <button onClick={() => setUnlocked(false)} className="lock-btn">Lock</button>
      </div>

      <div className="orders-grid">
        {orders.length === 0 ? (
          <div className="empty-state">No orders found. Sit tight!</div>
        ) : (
          orders.map((order, idx) => {
            const isNew = order["Order Status"] === "New";
            return (
              <div key={order["Order ID"] || idx} className={`order-card ${isNew ? 'pulse-new' : ''}`}>
                <div className="order-head">
                  <span className="order-id">{order["Order ID"]}</span>
                  <span className={`status-badge ${isNew ? 'new' : ''}`}>{order["Order Status"]}</span>
                </div>
                <div className="order-body">
                  <p><strong>{order["Customer Name"]}</strong> ({order["Phone"]})</p>
                  <div className="items-list">
                    {(() => {
                      try {
                        const items = JSON.parse(order["Items"] || "[]");
                        return items.map((itm, i) => (
                          <div key={i} className="itm-row">
                            <span>{itm.qty}x {itm.name}</span>
                            <span>{itm.price}</span>
                          </div>
                        ));
                      } catch(e) { return <span>{order["Items"]}</span> }
                    })()}
                  </div>
                  {order["Notes"] && <p className="order-notes">📝 {order["Notes"]}</p>}
                </div>
                <div className="order-foot">
                  <span className="method">{order["Payment Method"]} ({order["Payment Status"]})</span>
                  <span className="total">₹{order["Total"]}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .admin-dashboard { max-width: 800px; margin: 0 auto; padding: 24px; padding-bottom: 100px; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .admin-header h2 { display: flex; align-items: center; gap: 12px; }
        .admin-header p { color: var(--color-primary); font-size: 0.85rem; font-weight: 600; }
        .lock-btn { padding: 8px 16px; background: var(--color-surface-dim); border: none; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; }

        .loader { width: 12px; height: 12px; border-radius: 50%; background: var(--color-primary); animation: blink 1s infinite alternate; }
        @keyframes blink { from { opacity: 0.2; } to { opacity: 1; } }

        .orders-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
        
        .order-card { background: var(--color-surface-lowest); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-card); border-left: 4px solid var(--color-surface-container-high); }
        .pulse-new { border-left-color: var(--color-primary); animation: softPulse 2s infinite; }
        @keyframes softPulse { 0% { box-shadow: 0 0 0 0 rgba(255, 82, 0, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 82, 0, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 82, 0, 0); } }

        .order-head { display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--color-surface-container); }
        .order-id { font-family: monospace; font-weight: 700; font-size: 1.1rem; }
        .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; background: var(--color-surface-dim); color: var(--color-text); }
        .status-badge.new { background: var(--color-primary-light); color: var(--color-primary-dim); }

        .order-body { margin-bottom: 16px; }
        .items-list { background: var(--color-surface-container-low); padding: 12px; border-radius: var(--radius-md); margin: 12px 0; font-size: 0.9rem; }
        .itm-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .order-notes { font-size: 0.85rem; color: var(--color-warning); background: rgba(245, 124, 0, 0.1); padding: 8px; border-radius: 4px; }

        .order-foot { display: flex; justify-content: space-between; font-weight: 600; align-items: center; }
        .method { font-size: 0.85rem; color: var(--color-text-variant); text-transform: uppercase; }
        .total { font-size: 1.25rem; color: var(--color-primary); }

        .empty-state { text-align: center; padding: 40px; color: var(--color-text-variant); }
      `}</style>
    </div>
  );
}
