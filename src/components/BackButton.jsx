import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';
import './BackButton.css';

/**
 * Back arrow. Hidden on the home page (no previous page to return to).
 * Uses browser history: navigate(-1) goes to whichever page the user came from.
 */
export default function BackButton({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Home page has nothing to go back to.
  if (location.pathname === '/') return null;

  const handleBack = () => {
    // If the user came from another page in this tab, go back.
    // Otherwise fall back to the home page.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      type="button"
      className={`back-btn ${className}`}
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
    >
      <ArrowLeftIcon size={22} />
    </button>
  );
}