
import ProductCard from './ProductCard';

// Displays product cards for Home, Shop and other product sections.
export default function ProductGrid({
  products = [],
  empty,
  variant,
  compact = false,
  linkImageToProduct = false,
}) {
  if (!products.length) {
    return empty || null;
  }

  return (
    <div
      className={`product-grid${variant ? ` product-grid--${variant}` : ''}`}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          compact={compact}
          linkImageToProduct={linkImageToProduct}
        />
      ))}
    </div>
  );
}
