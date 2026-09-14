import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import {
  createCounterBill,
  fetchInvoicePdfUrl,
  listBills,
  listProducts,
  type Bill,
  type Product,
} from '../../api/franchiseApi';

interface CartLine {
  productId: string;
  quantity: number;
}

export function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
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

  function setQuantity(productId: string, quantity: number) {
    setCart((prev) => {
      const rest = prev.filter((line) => line.productId !== productId);
      return quantity > 0 ? [...rest, { productId, quantity }] : rest;
    });
  }

  async function handleCreateBill(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSaving(true);
    setError(null);
    try {
      await createCounterBill({
        items: cart,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
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
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>In stock</th>
                <th style={styles.th}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>₹{p.price.toFixed(2)}</td>
                  <td style={styles.td}>{p.stockQuantity}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="0"
                      max={p.stockQuantity}
                      style={{ ...styles.input, width: 70 }}
                      value={cart.find((line) => line.productId === p.id)?.quantity ?? ''}
                      onChange={(e) => setQuantity(p.id, Number(e.target.value) || 0)}
                    />
                  </td>
                </tr>
              ))}
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
