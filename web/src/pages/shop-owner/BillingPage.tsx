import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import {
  createCounterBill,
  fetchInvoicePdfUrl,
  listBills,
  listProducts,
  type Bill,
  type DiscountType,
  type Product,
} from '../../api/franchiseApi';

interface CartLine {
  productId: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  quantity: number;
}

const MAX_SEARCH_RESULTS = 8;

export function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('FLAT');
  const [discountValue, setDiscountValue] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [productList, billList] = await Promise.all([listProducts(), listBills()]);
      setProducts(productList);
      setBills(billList);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(term) && !cart.some((line) => line.productId === p.id))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [search, products, cart]);

  function addToCart(product: Product) {
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        quantity: 1,
      },
    ]);
    setSearch('');
  }

  function setCartQuantity(productId: string, quantity: number) {
    setCart((prev) => prev.map((line) => (line.productId === productId ? { ...line, quantity } : line)));
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  const cartTotal = cart.reduce((sum, line) => sum + line.sellingPrice * line.quantity, 0);

  async function handleCreateBill(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      await createCounterBill({
        items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discountType: discountValue ? discountType : undefined,
        discountValue: discountValue ? Number(discountValue) : undefined,
        note: note.trim() || undefined,
      });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountValue('');
      setNote('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleViewInvoice(billId: string) {
    try {
      const url = await fetchInvoicePdfUrl(billId);
      window.open(url, '_blank');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <p>Loading…</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Billing</h2>
      <p style={{ color: '#666', maxWidth: 640 }}>
        Counter sale for a walk-in patient — paid cash, invoice generated immediately.
      </p>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <form onSubmit={handleCreateBill} style={styles.form}>
        <h3 style={{ marginTop: 0 }}>New counter sale</h3>

        {products.length === 0 ? (
          <p style={{ color: '#666' }}>Add products to your inventory first.</p>
        ) : (
          <div style={styles.searchBox}>
            <label style={styles.label}>
              Search product to add
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Start typing a product name…"
                style={styles.input}
              />
            </label>
            {searchResults.length > 0 && (
              <ul style={styles.resultList}>
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => addToCart(p)} style={styles.resultButton}>
                      <span>{p.name}</span>
                      <span style={{ color: '#666' }}>
                        ₹{p.sellingPrice.toFixed(2)} · {p.stockQuantity} in stock
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {search.trim() && searchResults.length === 0 && (
              <p style={{ color: '#666', fontSize: '0.85rem' }}>No matching products.</p>
            )}
          </div>
        )}

        {cart.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Line total</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((line) => (
                <tr key={line.productId}>
                  <td style={styles.td}>{line.name}</td>
                  <td style={styles.td}>₹{line.sellingPrice.toFixed(2)}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="1"
                      max={line.stockQuantity}
                      value={line.quantity}
                      onChange={(e) => setCartQuantity(line.productId, Number(e.target.value) || 1)}
                      style={{ ...styles.input, width: 70 }}
                    />
                  </td>
                  <td style={styles.td}>₹{(line.sellingPrice * line.quantity).toFixed(2)}</td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => removeFromCart(line.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td style={styles.td} colSpan={3}>
                  <strong>Cart total</strong>
                </td>
                <td style={styles.td} colSpan={2}>
                  <strong>₹{cartTotal.toFixed(2)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <div style={styles.fieldRow}>
          <label style={styles.label}>
            Customer name (optional)
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Customer phone (optional)
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>
            Discount type
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              style={styles.input}
            >
              <option value="FLAT">Flat (₹)</option>
              <option value="PERCENTAGE">Percentage (%)</option>
            </select>
          </label>
          <label style={styles.label}>
            Discount value (optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <label style={{ ...styles.label, marginBottom: '1rem' }}>
          Note on invoice (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} style={styles.input} />
        </label>

        <button type="submit" disabled={isSaving || cart.length === 0}>
          {isSaving ? 'Creating…' : 'Create bill (cash)'}
        </button>
      </form>

      <h3>Past bills</h3>
      {bills.length === 0 ? (
        <p style={{ color: '#666' }}>No bills yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Invoice #</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Discount</th>
              <th style={styles.th}>Total</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td style={styles.td}>{bill.invoiceNumber ?? '—'}</td>
                <td style={styles.td}>{bill.customerName ?? bill.patientEmail ?? '—'}</td>
                <td style={styles.td}>{bill.discountAmount > 0 ? `₹${bill.discountAmount.toFixed(2)}` : '—'}</td>
                <td style={styles.td}>₹{bill.totalAmount.toFixed(2)}</td>
                <td style={styles.td}>{bill.status}</td>
                <td style={styles.td}>{new Date(bill.createdAt).toLocaleString()}</td>
                <td style={styles.td}>
                  {bill.invoiceNumber && (
                    <button onClick={() => handleViewInvoice(bill.id)}>View invoice</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    padding: '1.5rem',
    maxWidth: 720,
    marginBottom: '2rem',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '1rem',
  },
  resultList: {
    listStyle: 'none',
    margin: '0.5rem 0 0',
    padding: 0,
    border: '1px solid #e5e5e5',
    borderRadius: 4,
    maxWidth: 480,
  },
  resultButton: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: 'none',
    borderBottom: '1px solid #f0f0f0',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  },
  fieldRow: {
    display: 'flex',
    gap: '1rem',
    margin: '1rem 0',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    fontSize: '0.9rem',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    maxWidth: 800,
    marginBottom: '1rem',
  },
  th: {
    textAlign: 'left',
    borderBottom: '2px solid #e5e5e5',
    padding: '0.5rem',
  },
  td: {
    borderBottom: '1px solid #f0f0f0',
    padding: '0.5rem',
  },
};
