import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface OrderSummary {
  id: number;
  pickupCode: string;
  fileName: string;
  copies: number;
  colorMode: string;
  sides: string;
  paperSize: string;
  specialInstructions?: string;
  amount: number;
  paymentStatus: string;
}

export const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await axios.get<OrderSummary>(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/orders/${orderId}`,
        );
        setOrder(res.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load order details. Please keep your order ID safe.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-semibold">
              A
            </span>
            <div>
              <div className="text-sm font-semibold tracking-wide text-primary">ARCADE</div>
              <div className="text-xs text-muted">Order confirmation</div>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            New order
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-2xl bg-surface p-6 shadow-sm border border-gray-100">
          {loading && <p className="text-sm text-muted">Loading your order…</p>}
          {error && !loading && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {order && !loading && (
            <>
              <div className="mb-4">
                <h1 className="text-xl font-semibold text-primary">Order confirmed</h1>
                <p className="mt-1 text-xs text-muted">
                  Your payment has been received. Please show this pickup code at the ARCADE counter
                  to collect your prints.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 text-sm border border-dashed border-gray-200">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Pickup code
                </div>
                <div className="mt-1 text-2xl font-mono font-semibold text-primary">
                  {order.pickupCode}
                </div>
                <div className="mt-1 text-[11px] text-muted">
                  Keep this code private. You will need it at pickup.
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="text-muted">Order ID</dt>
                  <dd className="mt-1 font-medium text-primary">#{order.id}</dd>
                </div>
                <div>
                  <dt className="text-muted">File name</dt>
                  <dd className="mt-1 font-medium text-primary truncate">{order.fileName}</dd>
                </div>
                <div>
                  <dt className="text-muted">Copies</dt>
                  <dd className="mt-1 font-medium text-primary">{order.copies}</dd>
                </div>
                <div>
                  <dt className="text-muted">Color</dt>
                  <dd className="mt-1 font-medium text-primary">
                    {order.colorMode === 'COLOR' ? 'Color' : 'Black & White'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Sides</dt>
                  <dd className="mt-1 font-medium text-primary">
                    {order.sides === 'DOUBLE' ? 'Double-sided' : 'Single-sided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Paper size</dt>
                  <dd className="mt-1 font-medium text-primary">{order.paperSize}</dd>
                </div>
                <div>
                  <dt className="text-muted">Amount paid</dt>
                  <dd className="mt-1 font-medium text-primary">₹{order.amount}</dd>
                </div>
                <div>
                  <dt className="text-muted">Payment status</dt>
                  <dd className="mt-1 font-medium text-emerald-700">{order.paymentStatus}</dd>
                </div>
              </dl>

              {order.specialInstructions && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs border border-gray-100">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Special instructions
                  </div>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                    {order.specialInstructions}
                  </p>
                </div>
              )}

              <p className="mt-5 text-[11px] text-muted">
                Pickup location: ARCADE Printing Shop, Main Campus. Orders are usually ready within
                campus working hours. You will receive an email/SMS when your order is marked as
                ready for pickup.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

