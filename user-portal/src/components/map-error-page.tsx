// components/ErrorPage.tsx

import React from 'react';

const ErrorPage: React.FC = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <img
        src="/error-image.png"
        alt="Error Illustration"
        style={styles.image}
      />
      <h1 style={styles.title}>Something Went Wrong</h1>
      <p style={styles.message}>
        We encountered an error while loading the map.
      </p>
      <button style={styles.button} onClick={handleRefresh}>
        Try Again
      </button>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center' as const,
    paddingTop: '100px',
    color: '#333',
    padding: '0 20px',
  },
  image: {
    maxWidth: '400px',
    width: '100%',
    marginBottom: '40px',
  },
  title: {
    fontSize: '36px',
    marginBottom: '20px',
    color: '#1976d2',
  },
  message: {
    fontSize: '18px',
    marginBottom: '30px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default ErrorPage;
