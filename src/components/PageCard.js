import React from 'react';
import './PageCard.css';

export default function PageCard({ title, children, className = '' }) {
  return (
    <div className={`content shifted ${className}`}>
      <div className="page-card" role="main" aria-label={title || 'page'}>
        {title ? <div className="page-card-header"><h1>{title}</h1><hr/></div> : null}
        <div className="page-card-body">{children}</div>
      </div>
    </div>
  );
}
