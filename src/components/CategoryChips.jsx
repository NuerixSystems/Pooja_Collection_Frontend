import { Link } from 'react-router-dom';
import { getCategories } from '../services/catalog';

export default function CategoryChips({ activeSlug }) {
  return (
    <nav className="search-chips page-chips" aria-label="Categories">
      <Link to="/shop" className={`chip ${!activeSlug ? 'is-active' : ''}`}>All</Link>
      {getCategories().map((c) => (
        <Link key={c.slug} to={`/category/${c.slug}`} className={`chip ${activeSlug === c.slug ? 'is-active' : ''}`}>{c.name}</Link>
      ))}
    </nav>
  );
}
