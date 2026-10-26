import { useRef } from 'react';
import { getCategories } from '../services/catalog';
import { ChevronRightIcon } from './Icons';
import CategoryCard from './CategoryCard';

export default function CategoryGrid({ categories = getCategories() }) {
  const carouselRef = useRef(null);
  const scroll = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction * carouselRef.current.clientWidth * 0.75,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="category-carousel">
      <button type="button" className="home-carousel-arrow" aria-label="Previous categories" onClick={() => scroll(-1)}>
        <ChevronRightIcon size={20} className="is-reversed" />
      </button>
      <div className="category-marquee" ref={carouselRef} tabIndex="0" aria-label="Jewelry categories">
        <div className="category-track">
          <div className="category-set">
            {categories.map((category) => <CategoryCard key={category.slug} category={category} />)}
          </div>
          <div className="category-set" aria-hidden="true">
            {categories.map((category) => <CategoryCard key={category.slug} category={category} clone />)}
          </div>
        </div>
      </div>
      <button type="button" className="home-carousel-arrow" aria-label="Next categories" onClick={() => scroll(1)}>
        <ChevronRightIcon size={20} />
      </button>
    </div>
  );
}
