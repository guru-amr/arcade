import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

type OrderStatus = 'NEW' | 'PAID' | 'READY_FOR_PICKUP' | 'COMPLETED';

interface VendorOrder {
  id: number;
  pickupCode: string;
  studentName: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: string;
  amount: number;
}

interface VendorOrderDetail extends VendorOrder {
  studentEmail: string;
  studentPhone: string;
  copies: number;
  colorMode: string;
  sides: string;
  paperSize: string;
  specialInstructions?: string;
  paymentReference?: string;
  fileUrl?: string;
}

export const VendorDashboardPage = () => {
  const { token, logout } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrderDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('NEW');
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'LAST_7_DAYS' | 'ALL'>('TODAY');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (timeFilter === 'TODAY') params.fromDate = 'TODAY';
      else if (timeFilter === 'LAST_7_DAYS') params.fromDate = 'LAST_7_DAYS';

      const res = await axios.get<VendorOrder[]>(`${apiBase}/api/vendor/orders`, {
        headers: authHeaders,
        params,
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const res = await axios.get<VendorOrderDetail>(`${apiBase}/api/vendor/orders/${orderId}`, {
        headers: authHeaders,
      });
      setSelectedOrder(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load order details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await axios.patch(
        `${apiBase}/api/vendor/orders/${orderId}/status`,
        { status },
        { headers: authHeaders },
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
    }
  };

  const downloadPdf = async (orderId: number) => {
    try {
      const res = await axios.get(`${apiBase}/api/vendor/orders/${orderId}/file`, {
        headers: authHeaders,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to download PDF.');
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, timeFilter]);

  const statusBadgeClass = (status: OrderStatus) => {
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-semibold">
              A
            </span>
            <div>
              <div className="text-sm font-semibold tracking-wide text-primary">
                ARCADE Vendor Dashboard
              </div>
              <div className="text-xs text-muted">Manage campus print orders</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4 md:flex-row md:mx-auto md:max-w-6xl">
        <section className="md:w-3/5 rounded-2xl bg-surface p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-primary">Orders</h2>
              <p className="text-[11px] text-muted">
                Filter by status and time to manage today&apos;s queue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                className="rounded-md border border-gray-200 px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="ALL">All statuses</option>
                <option value="NEW">New</option>
                <option value="PAID">Paid</option>
                <option value="READY_FOR_PICKUP">Ready</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as 'TODAY' | 'LAST_7_DAYS' | 'ALL')}
                className="rounded-md border border-gray-200 px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="TODAY">Today</option>
                <option value="LAST_7_DAYS">Last 7 days</option>
                <option value="ALL">All time</option>
              </select>
            </div>
          </div>

          <div className="mt-4 max-h-[480px] overflow-auto rounded-xl border border-gray-100">
            <table className="min-w-full border-separate border-spacing-0 text-xs">
              <thead className="bg-gray-50 text-[11px] text-muted">
                <tr>
                  <th className="sticky top-0 z-10 border-b border-gray-100 px-3 py-2 text-left font-medium">
                    Order
                  </th>
                  <th className="sticky top-0 z-10 border-b border-gray-100 px-3 py-2 text-left font-medium">
                    Student
                  </th>
                  <th className="sticky top-0 z-10 border-b border-gray-100 px-3 py-2 text-left font-medium">
                    Status
                  </th>
                  <th className="sticky top-0 z-10 border-b border-gray-100 px-3 py-2 text-right font-medium">
                    Amount
                  </th>
                  <th className="sticky top-0 z-10 border-b border-gray-100 px-3 py-2 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-3 text-center text-xs text-muted">
                      Loading orders…
                    </td>
                  </tr>
                )}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-xs text-muted">
                      No orders found for the selected filters.
                    </td>
                  </tr>
                )}
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => fetchOrderDetail(order.id)}
                  >
                    <td className="border-b border-gray-50 px-3 py-2 align-middle">
                      <div className="font-mono text-[11px] text-primary">#{order.id}</div>
                      <div className="text-[10px] text-muted">{order.pickupCode}</div>
                    </td>
                    <td className="border-b border-gray-50 px-3 py-2 align-middle">
                      <div className="text-xs text-primary">{order.studentName}</div>
                      <div className="text-[10px] text-muted">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="border-b border-gray-50 px-3 py-2 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                          order.status,
                        )}`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="border-b border-gray-50 px-3 py-2 text-right align-middle">
                      <span className="font-medium text-primary">₹{order.amount}</span>
                    </td>
                    <td className="border-b border-gray-50 px-3 py-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchOrderDetail(order.id);
                        }}
                        className="rounded-md border border-gray-200 px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && (
            <p className="mt-2 text-[11px] text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="md:w-2/5 rounded-2xl bg-surface p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-primary">Order details</h2>
          <p className="text-[11px] text-muted">
            Select an order from the list to view print settings and update its status.
          </p>

          {detailLoading && (
            <p className="mt-4 text-xs text-muted">Loading order details…</p>
          )}

          {!detailLoading && !selectedOrder && (
            <p className="mt-4 text-xs text-muted">No order selected.</p>
          )}

          {selectedOrder && !detailLoading && (
            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Pickup code
                    </div>
                    <div className="mt-1 font-mono text-lg font-semibold text-primary">
                      {selectedOrder.pickupCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted">Status</div>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                        selectedOrder.status,
                      )}`}
                    >
                      {selectedOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-muted">Student</div>
                  <div className="mt-1 font-medium text-primary">{selectedOrder.studentName}</div>
                  <div className="mt-0.5 text-[10px] text-muted">{selectedOrder.studentEmail}</div>
                  <div className="mt-0.5 text-[10px] text-muted">
                    {selectedOrder.studentPhone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted">Amount</div>
                  <div className="mt-1 font-medium text-primary">₹{selectedOrder.amount}</div>
                  <div className="mt-0.5 text-[10px] text-emerald-700">
                    {selectedOrder.paymentStatus}
                  </div>
                  {selectedOrder.paymentReference && (
                    <div className="mt-0.5 text-[10px] text-muted">
                      Ref: {selectedOrder.paymentReference}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-muted">Copies</div>
                  <div className="mt-1 font-medium text-primary">{selectedOrder.copies}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted">Color</div>
                  <div className="mt-1 font-medium text-primary">
                    {selectedOrder.colorMode === 'COLOR' ? 'Color' : 'Black & White'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted">Sides</div>
                  <div className="mt-1 font-medium text-primary">
                    {selectedOrder.sides === 'DOUBLE' ? 'Double-sided' : 'Single-sided'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-muted">Paper size</div>
                <div className="mt-1 font-medium text-primary">{selectedOrder.paperSize}</div>
              </div>

              {selectedOrder.specialInstructions && (
                <div>
                  <div className="text-[11px] text-muted">Special instructions</div>
                  <div className="mt-1 rounded-md bg-gray-50 p-2 text-[11px] text-gray-700 border border-gray-100 whitespace-pre-wrap">
                    {selectedOrder.specialInstructions}
                  </div>
                </div>
              )}

              {selectedOrder.fileUrl && (
                <button
                  type="button"
                  onClick={() => downloadPdf(selectedOrder.id)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-800 hover:bg-gray-50"
                >
                  Download PDF
                </button>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => updateStatus(selectedOrder.id, 'READY_FOR_PICKUP')}
                  className="flex-1 rounded-md bg-sky-600 px-3 py-2 text-[11px] font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                  disabled={selectedOrder.status === 'READY_FOR_PICKUP' || selectedOrder.status === 'COMPLETED'}
                >
                  Mark as ready for pickup
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selectedOrder.id, 'COMPLETED')}
                  className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-[11px] font-medium text-white hover:bg-black disabled:opacity-60"
                  disabled={selectedOrder.status === 'COMPLETED'}
                >
                  Mark as completed
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

