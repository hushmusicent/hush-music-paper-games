import React from 'react';

interface PaperPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperPanel: React.FC<PaperPanelProps> = ({ children, className = '' }) => {
  return (
    <div className={`paper ${className}`}>
      {children}
    </div>
  );
};
