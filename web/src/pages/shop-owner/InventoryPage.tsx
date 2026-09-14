import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { createProduct, listProducts, type Product } from '../../api/franchiseApi';

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [gstPercentage, setGstPercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setProducts(await listProducts());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sellingPrice || !stockQuantity) return;

    setIsSaving(true);
    setError(null);
    try {
      await createProduct({
        name: name.trim(),
        unit: unit.trim() || undefined,
        sellingPrice: Number(sellingPrice),
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        mfgDate: mfgDate || undefined,
        expiryDate: expiryDate || undefined,
        stockQuantity: Number(stockQuantity),
        gstPercentage: gstPercentage ? Number(gstPercentage) : undefined,
      });
      setName('');
      setUnit('');
      setSellingPrice('');
      setPurchasePrice('');
      setMfgDate('');
      setExpiryDate('');
      setStockQuantity('');
      setGstPercentage('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Inventory</h2>

      {error && <p style={{ color: '#c0392b' }}>{error}</p>}

      <form onSubmit={handleCreate} style={styles.form}>
        <h3 style={{ marginTop: 0 }}>Add a product</h3>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
          </label>
          <label style={styles.label}>
            Unit
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. strip" style={styles.input} />
          </label>
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            Selling price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Purchase price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="optional"
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Stock quantity
            <input
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            GST %
            <input
              type="number"
              min="0"
              step="0.01"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
        <div style={styles.fieldRow}>
          <label style={styles.label}>
            Mfg. date
            <input
              type="date"
              value={mfgDate}
              onChange={(e) => setMfgDate(e.target.value)}
              max={today}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Expiry date
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
        <button type="submit" disabled={isSaving || !name.trim() || !sellingPrice || !stockQuantity}>
          {isSaving ? 'Adding…' : 'Add product'}
        </button>
      </form>

      <h3>Catalog</h3>
      {isLoading ? (
        <p>Loading…</p>
      ) : products.length === 0 ? (
        <p style={{ color: '#666' }}>No products yet — add one above.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Unit</th>
              <th style={styles.th}>Selling Price</th>
              <th style={styles.th}>Purchase Price</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>GST %</th>
              <th style={styles.th}>Mfg. Date</th>
              <th style={styles.th}>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isExpired = !!p.expiryDate && p.expiryDate < today;
              return (
                <tr key={p.id}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.unit ?? '—'}</td>
                  <td style={styles.td}>₹{p.sellingPrice.toFixed(2)}</td>
                  <td style={styles.td}>{p.purchasePrice != null ? `₹${p.purchasePrice.toFixed(2)}` : '—'}</td>
                  <td style={styles.td}>{p.stockQuantity}</td>
                  <td style={styles.td}>{p.gstPercentage.toFixed(2)}</td>
                  <td style={styles.td}>{p.mfgDate ?? '—'}</td>
                  <td style={{ ...styles.td, color: isExpired ? '#c0392b' : undefined, fontWeight: isExpired ? 600 : undefined }}>
                    {p.expiryDate ?? '—'}
                  </td>
                </tr>
              );
            })}
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
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
    minWidth: 140,
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
    maxWidth: 960,
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
