import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

type ColorMode = 'BLACK_WHITE' | 'COLOR';
type Sides = 'SINGLE' | 'DOUBLE';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [copies, setCopies] = useState(1);
  const [pages, setPages] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>('BLACK_WHITE');
  const [sides, setSides] = useState<Sides>('SINGLE');
  const [paperSize, setPaperSize] = useState('A4');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Require login to place orders
  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      navigate('/student/login');
    }
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const estimatedPrice = pages * copies * (colorMode === 'COLOR' ? 10 : (sides === 'DOUBLE' ? 1.5 : 1.2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF file.');
      return;
    }
    if (!studentName || !studentEmail || !studentPhone) {
      setError('Please fill in your name, email, and phone.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('copies', String(copies));
      formData.append('pages', String(pages));
      formData.append('colorMode', colorMode);
      formData.append('sides', sides);
      formData.append('paperSize', paperSize);
      formData.append('specialInstructions', specialInstructions);
      formData.append('studentName', studentName);
      formData.append('studentEmail', studentEmail);
      formData.append('studentPhone', studentPhone);

      const token = localStorage.getItem('studentToken');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/orders/create`,
        formData,
        { headers },
      );

      const { orderId } = res.data;
      navigate(`/order/pay/${orderId}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.message || 'Something went wrong while creating your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-semibold">
              A
            </span>
            <div>
              <div className="text-sm font-semibold tracking-wide text-primary">ARCADE</div>
              <div className="text-xs text-muted">College Printing Hub</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {localStorage.getItem('studentToken') ? (
              <>
                <Link to="/my-orders" className="text-xs text-muted hover:text-primary">
                  My Orders
                </Link>
                <span className="text-xs text-primary">Hi, {localStorage.getItem('studentName')}</span>
              </>
            ) : (
              <>
                <Link to="/student/login" className="text-xs text-muted hover:text-primary">
                  Login
                </Link>
                <Link
                  to="/student/signup"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row">
          <section className="md:w-1/2 space-y-6">
            <div>
              <h1 className="text-3xl font-semibold text-primary md:text-4xl">
                Print Easy.
              </h1>
              <p className="mt-3 text-sm text-muted md:text-base">
                Upload your PDF, choose your options, pay online, and collect your prints with a
                unique pickup code at the ARCADE print desk.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="rounded-xl bg-surface p-4 shadow-sm border border-gray-100">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Step 1
                </div>
                <div className="font-medium text-primary">Upload</div>
                <p className="mt-1 text-xs text-muted">Attach your PDF and choose print details.</p>
              </div>
              <div className="rounded-xl bg-surface p-4 shadow-sm border border-gray-100">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Step 2
                </div>
                <div className="font-medium text-primary">Pay</div>
                <p className="mt-1 text-xs text-muted">Secure online payment via UPI / cards.</p>
              </div>
              <div className="rounded-xl bg-surface p-4 shadow-sm border border-gray-100">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Step 3
                </div>
                <div className="font-medium text-primary">Collect</div>
                <p className="mt-1 text-xs text-muted">
                  Show your pickup code and collect from the shop.
                </p>
              </div>
            </div>
          </section>

          <section className="md:w-1/2">
            <div className="rounded-2xl bg-surface p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-primary">Place a print order</h2>
              <p className="mt-1 text-xs text-muted">
                Upload one PDF per order. For multiple files, create separate orders.
              </p>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    PDF file <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-xs file:mr-3 file:rounded-md file:border-none file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Pages <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={pages}
                      onChange={(e) => setPages(Number(e.target.value) || 1)}
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Copies <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={copies}
                      onChange={(e) => setCopies(Number(e.target.value) || 1)}
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Paper size</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="LETTER">Letter</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Color</label>
                    <select
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value as ColorMode)}
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="BLACK_WHITE">Black &amp; White</option>
                      <option value="COLOR">Color</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Sides</label>
                    <select
                      value={sides}
                      onChange={(e) => setSides(e.target.value as Sides)}
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="SINGLE">Single-sided</option>
                      <option value="DOUBLE">Double-sided</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Special instructions
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Example: Print pages 2–10 only, staple top-left."
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-200 px-2 py-2 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <div className="text-muted">
                    Estimated total:{' '}
                    <span className="font-semibold text-primary">₹{estimatedPrice}</span>
                    <span className="ml-1 text-[10px] text-muted">Approximate</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-gray-900 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Processing…' : 'Proceed to payment'}
                  </button>
                </div>

                {error && (
                  <p className="mt-2 text-xs text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-[11px] text-muted">
          <span>© {new Date().getFullYear()} ARCADE Printing</span>
          <span>Designed for fast campus networks.</span>
        </div>
      </footer>
    </div>
  );
};

