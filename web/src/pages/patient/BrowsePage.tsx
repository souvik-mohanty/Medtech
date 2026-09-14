import { useEffect, useMemo, useState } from 'react';
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
  stockQuantity: number;
  quantity: number;
}

const MAX_SEARCH_RESULTS = 8;

export function BrowsePage() {
  const navigate = useNavigate();
  const { franchise, isLoading: isLoadingFranchise, error: franchiseError } = useActiveFranchise();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    if (!franchise) return;
    setIsLoading(true);
    setError(null);
    browseFranchiseProducts(franchise.id)
      .then(setProducts)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [franchise]);

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || !products) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(term) && !cart.some((line) => line.productId === p.id))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [search, products, cart]);

  function addToCart(product: Product) {
    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        price: product.sellingPrice,
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

  function handleProceed() {
    if (!franchise || cart.length === 0) return;
    navigate('/patient/order', { state: { franchiseId: franchise.id, lines: cart } });
  }

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

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

      {products && products.length === 0 ? (
        <p style={{ color: '#666' }}>This shop has no products listed.</p>
      ) : (
        <>
          <div style={styles.searchBox}>
            <label style={styles.label}>
              Search medicine
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Start typing a medicine name…"
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
              <p style={{ color: '#666', fontSize: '0.85rem' }}>No matching medicines.</p>
            )}
          </div>

          {cart.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Medicine</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Line total</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((line) => (
                  <tr key={line.productId}>
                    <td style={styles.td}>{line.productName}</td>
                    <td style={styles.td}>₹{line.price.toFixed(2)}</td>
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
                    <td style={styles.td}>₹{(line.price * line.quantity).toFixed(2)}</td>
                    <td style={styles.td}>
                      <button type="button" onClick={() => removeFromCart(line.productId)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={styles.td} colSpan={3}>
                    <strong>Total</strong>
                  </td>
                  <td style={styles.td} colSpan={2}>
                    <strong>₹{cartTotal.toFixed(2)}</strong>
                  </td>
                </tr>
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
  searchBox: {
    position: 'relative',
    marginBottom: '1.5rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    fontSize: '0.9rem',
    maxWidth: 420,
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
