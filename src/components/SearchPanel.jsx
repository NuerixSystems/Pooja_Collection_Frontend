import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchSuggestions } from '../services/catalog';
import { formatPrice } from '../utils/format';
import { useUI } from '../context/UIContext';
import Panel from './Panel';
import { SearchIcon } from './Icons';
import './SearchPanel.css';

function SearchBody({ onClose }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const hasQuery = query.trim().length > 0;

  // Debounced live suggestions: recompute 120 ms after the user stops typing.
  // useMemo keeps the value stable between renders; the timeout avoids
  // recomputing on every keystroke for large catalogues.
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const { categories, products } = useMemo(
    () => searchSuggestions(debounced),
    [debounced],
  );

  const submit = (e) => {
    e.preventDefault();
    if (!hasQuery) return;
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  return (
    <div className="search">
      <form className="search-form" onSubmit={submit} role="search">
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search watches, necklaces, rings…"
          aria-label="Search products"
          autoFocus
          autoComplete="off"
        />
        <button type="submit" className="btn" disabled={!hasQuery}>Search</button>
      </form>

      {hasQuery && (
        <div className="search-results">
          {categories.length > 0 && (
            <div className="search-chips">
              {categories.map((c) => (
                <Link key={c.slug} to={`/category/${c.slug}`} onClick={onClose} className="chip">
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {products.length === 0 && categories.length === 0 ? (
            <p className="search-empty">
              No matches for “{query.trim()}”. Try a category like rings or necklaces.
            </p>
          ) : (
            <ul className="search-list">
              {products.map((p) => (
                <li key={p.id}>
                  <Link to={`/product/${p.slug}`} onClick={onClose}>
                    <img src={p.image} alt="" width="48" height="60" />
                    <span className="search-name">{p.name}</span>
                    <span className="search-price">{formatPrice(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {hasQuery && products.length > 0 && (
            <p className="search-more">
              <Link to={`/shop?q=${encodeURIComponent(query.trim())}`} onClick={onClose}>
                See all results →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPanel() {
  const { panel, close } = useUI();
  const isOpen = panel === 'search';
  return (
    <Panel open={isOpen} onClose={close} side="top" label="Search">
      {isOpen && <SearchBody onClose={close} />}
    </Panel>
  );
}