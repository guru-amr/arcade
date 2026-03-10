import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

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

export const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid = order?.paymentStatus === 'SUCCESS';

  useEffect(() => {
    if (!orderId) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<OrderSummary>(`${apiBase}/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (e) {
        console.error(e);
        setError('Unable to load order.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [apiBase, orderId]);

  const canUseRazorpay = useMemo(() => Boolean(razorpayKeyId && window.Razorpay), [razorpayKeyId]);

  const confirmPaid = async (paymentReference: string) => {
    if (!orderId) return;
    await axios.post(`${apiBase}/api/orders/${orderId}/confirm-payment`, {
      paymentStatus: 'SUCCESS',
      paymentReference,
    });
  };

  const simulatePayment = async () => {
    if (!orderId) return;
    setPaying(true);
    setError(null);
    try {
      await confirmPaid(`SIMULATED_${Date.now()}`);
      navigate(`/order/confirmation/${orderId}`);
    } catch (e) {
      console.error(e);
      setError('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const startRazorpay = async () => {
    if (!orderId || !order || !razorpayKeyId) return;
    setPaying(true);
    setError(null);
    try {
      const rpRes = await axios.post<{ razorpayOrderId: string; amountPaise: number; currency: string }>(
        `${apiBase}/api/payments/razorpay/create-order`,
        { orderId: Number(orderId) },
      );

      const options = {
        key: razorpayKeyId,
        amount: rpRes.data.amountPaise,
        currency: rpRes.data.currency,
        name: 'ARCADE Printing',
        description: `Print order #${order.id}`,
        order_id: rpRes.data.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await axios.post(`${apiBase}/api/payments/razorpay/verify`, {
              orderId: Number(orderId),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(`/order/confirmation/${orderId}`);
          } catch (e) {
            console.error(e);
            setError('Payment verification failed.');
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError('Payment cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      setError('Unable to start payment. Check Razorpay keys/server config.');
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-semibold">
              A
            </span>
            <div>
              <div className="text-sm font-semibold tracking-wide text-primary">ARCADE</div>
              <div className="text-xs text-muted">Payment</div>
            </div>
          </div>
          <Link to="/" className="text-xs font-medium text-primary hover:underline underline-offset-2">
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl bg-surface p-6 shadow-sm border border-gray-100">
          {loading && <p className="text-sm text-muted">Loading…</p>}

          {error && !loading && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {order && !loading && (
            <>
              <h1 className="text-lg font-semibold text-primary">Complete your payment</h1>
              <p className="mt-1 text-xs text-muted">
                Order #{order.id} • File: <span className="font-medium">{order.fileName}</span>
              </p>

              <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-muted">Amount</div>
                    <div className="mt-1 text-2xl font-semibold text-primary">₹{order.amount}</div>
                    <div className="mt-1 text-[11px] text-muted">
                      Payment status: <span className="font-medium">{order.paymentStatus}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-muted">
                    Pickup code generated:
                    <div className="mt-1 font-mono text-sm text-primary">{order.pickupCode}</div>
                  </div>
                </div>
              </div>

              {isPaid ? (
                <div className="mt-4">
                  <button
                    className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-gray-900"
                    onClick={() => navigate(`/order/confirmation/${order.id}`)}
                  >
                    View confirmation
                  </button>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={paying || !canUseRazorpay}
                    onClick={startRazorpay}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                    title={
                      canUseRazorpay
                        ? 'Pay with Razorpay'
                        : 'Razorpay not configured (missing key or script).'
                    }
                  >
                    {paying ? 'Processing…' : 'Pay with Razorpay (test)'}
                  </button>

                  <button
                    type="button"
                    disabled={paying}
                    onClick={simulatePayment}
                    className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Simulate payment (dev)
                  </button>
                </div>
              )}

              <p className="mt-4 text-[11px] text-muted">
                Note: Razorpay test mode requires you to set `VITE_RAZORPAY_KEY_ID` and backend Razorpay keys.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

