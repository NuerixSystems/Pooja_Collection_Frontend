import { Link } from 'react-router-dom';
import SafeImage from './SafeImage';
import './CategoryCard.css';

export default function CategoryCard({ category, clone = false }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className={clone ? 'cat-item' : 'category-card cat-item'}
      tabIndex={clone ? -1 : undefined}
    >
      <span className="cat-circle">
        <SafeImage src={category.image} alt="" label={category.name} className="category-card-img" />
      </span>
      <span className="category-card-name">{category.name}</span>
    </Link>
  );
}
