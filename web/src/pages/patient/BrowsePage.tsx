import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/AppLayout';
import { errorMessage } from '../../api/client';
import { browseFranchiseProducts } from '../../api/patientApi';
import type { Product } from '../../api/franchiseApi';
import { useActiveFranchise } from './useActiveFranchise';

interface CartLine {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export function BrowsePage() {
  const navigate = useNavigate();
  const { franchise, isLoading: isLoadingFranchise, error: franchiseError } = useActiveFranchise();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!franchise) return;
    setIsLoading(true);
    setError(null);
    browseFranchiseProducts(franchise.id)
      .then(setProducts)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [franchise]);

  function setQuantity(productId: string, quantity: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (quantity > 0) {
        next[productId] = quantity;
      } else {
        delete next[productId];
      }
      return next;
    });
  }

  function handleProceed() {
    if (!franchise) return;
    const lines: CartLine[] = Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products?.find((p) => p.id === productId);
        return product ? { productId, productName: product.name, price: product.sellingPrice, quantity } : null;
      })
      .filter((line): line is CartLine => line !== null);

    if (lines.length === 0) return;
    navigate('/patient/order', { state: { franchiseId: franchise.id, lines } });
  }

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (isLoadingFranchise || isLoading) {
    return (
      <AppLayout>
        <p>Loading…</p>
      </AppLayout>
    );
  }

  if (franchiseError || error) {
    return (
      <AppLayout>
        <p style={{ color: '#c0392b' }}>{franchiseError ?? error}</p>
      </AppLayout>
    );
  }

  if (!franchise) {
    return (
      <AppLayout>
        <p style={{ color: '#666' }}>No shop is available yet — check back later.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h2 style={{ marginTop: 0 }}>Order medicine — {franchise.name}</h2>

      {products && (
        <>
          {products.length === 0 ? (
            <p style={{ color: '#666' }}>This shop has no products listed.</p>
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
                    <td style={styles.td}>₹{p.sellingPrice.toFixed(2)}</td>
                    <td style={styles.td}>{p.stockQuantity}</td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        max={p.stockQuantity}
                        style={{ ...styles.input, width: 70 }}
                        value={cart[p.id] ?? ''}
                        onChange={(e) => setQuantity(p.id, Number(e.target.value) || 0)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button onClick={handleProceed} disabled={cartCount === 0} style={{ marginTop: '1rem' }}>
            Proceed to order ({cartCount} item{cartCount === 1 ? '' : 's'})
          </button>
        </>
      )}
    </AppLayout>
  );
}

const styles: Record<string, CSSProperties> = {
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
