import { Link, useParams } from 'react-router-dom';
import CategoryChips from '../components/CategoryChips';
import ProductGrid from '../components/ProductGrid';
import { getCategory, getProducts } from '../services/catalog';
import { formatPrice } from '../utils/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import NotFound from './NotFound';

export default function CategoryPage() {
  const { slug } = useParams();
  const category = getCategory(slug); // excluded categories (e.g. Dresses) resolve to null
  useDocumentTitle(category ? category.name : 'Category not found');
  if (!category) return <NotFound message="We couldn't find that category." />;

  const products = getProducts({ categorySlug: slug });
  return (
    <div className="container category-page">
      <section className="section">
        <div className="section-head">
          <div>
            <h1 className="section-title">{category.name}</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{products.length} {products.length === 1 ? 'design' : 'designs'} · {category.minPrice === category.maxPrice ? formatPrice(category.minPrice) : `${formatPrice(category.minPrice)} – ${formatPrice(category.maxPrice)}`}</p>
          </div>
        </div>
        <CategoryChips activeSlug={slug} />
        <ProductGrid
          products={products}
          empty={<div className="empty"><h2>Nothing here yet</h2><p>New pieces are on the way.</p><Link to="/" className="btn">Browse categories</Link></div>}
        />
      </section>
    </div>
  );
}
