import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 0.5rem;
  
  .dark & {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200px 100%;
  }
`;

export const PostSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    {/* Header */}
    <div className="flex items-center gap-3">
      <SkeletonBase className="w-3 h-3 rounded-full" />
      <SkeletonBase className="w-20 h-4" />
      <SkeletonBase className="w-16 h-6 rounded-full" />
      <SkeletonBase className="w-12 h-3" />
    </div>
    
    {/* Title */}
    <SkeletonBase className="w-3/4 h-6" />
    
    {/* Content */}
    <div className="space-y-2">
      <SkeletonBase className="w-full h-4" />
      <SkeletonBase className="w-5/6 h-4" />
    </div>
    
    {/* Author */}
    <SkeletonBase className="w-24 h-3" />
    
    {/* Actions */}
    <div className="flex items-center gap-4 pt-2">
      <SkeletonBase className="w-12 h-8 rounded-lg" />
      <SkeletonBase className="w-12 h-8 rounded-lg" />
      <SkeletonBase className="w-12 h-8 rounded-lg" />
    </div>
  </div>
);

export const CommunitySkeleton = () => (
  <div className="flex flex-col items-center p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg">
    <SkeletonBase className="w-8 h-8 rounded-full mb-2" />
    <SkeletonBase className="w-16 h-3 mb-1" />
    <SkeletonBase className="w-12 h-3" />
  </div>
);

export const SidebarSkeleton = () => (
  <div className="glass-card p-4 space-y-4">
    <div className="flex items-center gap-2 mb-4">
      <SkeletonBase className="w-5 h-5" />
      <SkeletonBase className="w-20 h-5" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg">
          <SkeletonBase className="w-4 h-4" />
          <div className="flex-1 space-y-1">
            <SkeletonBase className="w-full h-4" />
            <SkeletonBase className="w-2/3 h-3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SearchSkeleton = () => (
  <div className="w-64 h-10 bg-white/40 dark:bg-slate-800/40 rounded-lg animate-pulse" />
);

// Inline skeleton for quick loading states
export const InlineSkeleton = ({ width = "100%", height = "1rem", className = "" }) => (
  <SkeletonBase 
    className={className}
    style={{ width, height }}
  />
);

export default {
  PostSkeleton,
  CommunitySkeleton,
  SidebarSkeleton,
  SearchSkeleton,
  InlineSkeleton
};
