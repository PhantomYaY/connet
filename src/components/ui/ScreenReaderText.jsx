import React from 'react';

// Screen reader only text component
export const ScreenReaderOnly = ({ children, as: Component = 'span', ...props }) => (
  <Component
    className="sr-only"
    {...props}
  >
    {children}
  </Component>
);

// Live region for dynamic content announcements
export const LiveRegion = ({ children, level = 'polite', ...props }) => (
  <div
    aria-live={level}
    aria-atomic="true"
    className="sr-only"
    {...props}
  >
    {children}
  </div>
);

// Skip link for keyboard navigation
export const SkipLink = ({ href = '#main-content', children = 'Skip to main content' }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg"
  >
    {children}
  </a>
);

export default { ScreenReaderOnly, LiveRegion, SkipLink };
