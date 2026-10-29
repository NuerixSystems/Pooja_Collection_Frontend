import ProductCard from './ProductCard';

// variant="shop": grid sits beside the filter sidebar, so it uses fewer columns (see ProductCard.css).
export default function ProductGrid({ products, empty, variant, compact }) {
  if (!products.length) return empty || null;
  return (
    <div className={`product-grid${variant ? ` product-grid--${variant}` : ''}`}>
      {products.map((p) => <ProductCard key={p.id} product={p} compact={compact ?? variant === 'home'} />)}
    </div>
  );
}
