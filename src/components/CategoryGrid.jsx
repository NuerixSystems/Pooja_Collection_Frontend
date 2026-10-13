import { getCategories } from '../services/catalog';
import CategoryCard from './CategoryCard';

// Circular categories in an auto-moving row. The list is rendered twice so the loop is seamless;
// the second copy is hidden from assistive tech and the tab order. Every item is still a normal link.
export default function CategoryGrid({ categories = getCategories() }) {
  return (
    <div className="category-marquee">
      <div className="category-track">
        <div className="category-set">
          {categories.map((c) => <CategoryCard key={c.slug} category={c} />)}
        </div>
        <div className="category-set" aria-hidden="true">
          {categories.map((c) => <CategoryCard key={c.slug} category={c} clone />)}
        </div>
      </div>
    </div>
  );
}
