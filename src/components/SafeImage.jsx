import { useState } from 'react';

// Image with a graceful fallback tile if the source (e.g. a future CRM URL) fails to load.
export default function SafeImage({ src, alt, label, className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className={`safe-image-fallback ${className}`} role="img" aria-label={alt}>
        <span>{(label || alt || 'P').trim().charAt(0)}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} {...rest} />;
}
