import React from 'react';
import './PageCard.css';

export default function PageCard({ title, children, className = '', shifted = true }) {
  return (
    <div className={`content ${shifted ? 'shifted' : 'not-shifted'} ${className}`}>
      <div className="page-card" role="main" aria-label={title || 'page'}>
        {title ? (
          <div className="page-card-header">
            <h1
              style={{
                background: "linear-gradient(90deg, #1e37d7ff, #00c6ff, #010d7dff)",
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradientMove 5s ease infinite"
              }}
            >
              {title}
            </h1>
            <hr />
            <style>
              {`
                @keyframes gradientMove {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}
            </style>
          </div>
        ) : null}
        <div className="page-card-body">{children}</div>
      </div>
    </div>
  );
}

