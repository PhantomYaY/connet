import React, { lazy, Suspense } from 'react';
import SkeletonLoader from './SkeletonLoader';

// Lazy load the editor for code splitting
const OptimizedWordEditor = lazy(() => import('./OptimizedWordEditor'));

const LazyEditor = (props) => {
  return (
    <Suspense fallback={<SkeletonLoader variant="editor" />}>
      <OptimizedWordEditor {...props} />
    </Suspense>
  );
};

export default LazyEditor;
