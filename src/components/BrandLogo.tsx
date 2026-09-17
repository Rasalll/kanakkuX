import React from 'react';

export const LOGO_MARK = '/logos/logo mark.png';
export const LOGO_WORDMARK = '/logos/KanakkuX logo.png';

export const LogoMark: React.FC<{ className?: string; alt?: string }> = ({
  className = 'h-8 w-8',
  alt = 'KanakkuX',
}) => (
  <img src={LOGO_MARK} alt={alt} className={`object-contain ${className}`} />
);

export const LogoWordmark: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <img src={LOGO_WORDMARK} alt="KanakkuX" className={`object-contain ${className}`} />
);
