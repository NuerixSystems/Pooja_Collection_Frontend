import { useEffect, useState } from 'react';

// Image with a graceful fallback tile if the source (e.g. a future CRM URL) fails to load.
export default function SafeImage({ src, fallbackSrc, alt, label, className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
    setFailed(false);
  }, [src]);

  const handleError = () => {
    if (fallbackSrc && imageSrc !== fallbackSrc) setImageSrc(fallbackSrc);
    else setFailed(true);
  };

  if (failed || !imageSrc) {
    return (
      <div className={`safe-image-fallback ${className}`} role="img" aria-label={alt}>
        <span>{(label || alt || 'P').trim().charAt(0)}</span>
      </div>
    );
  }
  return <img src={imageSrc} alt={alt} className={className} loading="lazy" onError={handleError} {...rest} />;
}
