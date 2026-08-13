import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 'var(--space-xl)',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: '120px',
          color: 'var(--color-primary)',
          opacity: 0.15,
          marginBottom: 'var(--space-md)',
        }}
      >
        sentiment_very_dissatisfied
      </span>
      <h1 className="text-display-lg" style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
        404
      </h1>
      <h2 className="text-headline-md" style={{ marginBottom: 'var(--space-md)' }}>
        Page Not Found
      </h2>
      <p className="color-on-surface-variant" style={{ maxWidth: '400px', marginBottom: 'var(--space-xl)' }}>
        The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn btn-primary">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
