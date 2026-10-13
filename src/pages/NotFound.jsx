import { Link } from 'react-router-dom';

export default function NotFound({ message = "We couldn't find that page." }) {
  return (
    <div className="container">
      <div className="empty">
        <h1 style={{ fontSize: '2rem' }}>Page not found</h1>
        <p>{message}</p>
        <Link to="/" className="btn">Back to categories</Link>
      </div>
    </div>
  );
}
