import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Order {
  id: number;
  pickupCode: string;
  fileName: string;
  copies: number;
  status: string;
  paymentStatus: string;
  amount: number;
  createdAt: string;
}

export const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const token = localStorage.getItem('studentToken');
  const studentName = localStorage.getItem('studentName');

  useEffect(() => {
    if (!token) {
      navigate('/student/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/student/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('studentToken');
          localStorage.removeItem('studentName');
          navigate('/student/login');
        } else {
          setError('Failed to load orders');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, navigate, apiBase]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PAID':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'READY_FOR_PICKUP':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'COMPLETED':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentName');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-semibold">
              A
            </Link>
            <div>
              <div className="text-sm font-semibold tracking-wide text-primary">ARCADE</div>
              <div className="text-xs text-muted">My Orders</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary">Hi, {studentName}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-muted hover:text-primary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-primary">My Orders</h1>
            <Link
              to="/"
              className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-gray-900"
            >
              New Order
            </Link>
          </div>

          {loading && <p className="text-sm text-muted">Loading orders...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && orders.length === 0 && (
            <div className="rounded-2xl bg-surface p-8 text-center shadow-sm border border-gray-100">
              <p className="text-sm text-muted">No orders yet. Create your first order!</p>
              <Link
                to="/"
                className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-gray-900"
              >
                Place Order
              </Link>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-surface p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-mono text-lg font-semibold text-primary">
                          {order.pickupCode}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor(
                            order.status
                          )}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{order.fileName}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                        <span>{order.copies} copies</span>
                        <span>₹{order.amount}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted">Payment</div>
                      <div className="mt-1 text-sm font-medium text-emerald-700">
                        {order.paymentStatus}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
