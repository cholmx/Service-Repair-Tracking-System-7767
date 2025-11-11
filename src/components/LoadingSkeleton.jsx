import React from 'react';

const LoadingSkeleton = ({ type = 'default' }) => {
  if (type === 'dashboard') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-neutral-300 rounded w-64 mb-2"></div>
          <div className="h-4 bg-neutral-300 rounded w-96"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-neutral-300 rounded w-24"></div>
                <div className="h-8 w-8 bg-neutral-300 rounded"></div>
              </div>
              <div className="h-8 bg-neutral-300 rounded w-16 mb-2"></div>
              <div className="h-3 bg-neutral-300 rounded w-32"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-6 bg-neutral-300 rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="border border-neutral-200 rounded-lg p-4">
                    <div className="h-4 bg-neutral-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-neutral-300 rounded w-full mb-2"></div>
                    <div className="h-3 bg-neutral-300 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'tracking') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-neutral-300 rounded w-64 mb-2"></div>
          <div className="h-4 bg-neutral-300 rounded w-96"></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-neutral-300 rounded"></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-neutral-200">
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-4 bg-neutral-300 rounded"></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-neutral-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6">
                <div className="grid grid-cols-6 gap-4">
                  <div className="h-4 bg-neutral-300 rounded"></div>
                  <div className="h-4 bg-neutral-300 rounded"></div>
                  <div className="h-4 bg-neutral-300 rounded"></div>
                  <div className="h-4 bg-neutral-300 rounded"></div>
                  <div className="h-4 bg-neutral-300 rounded"></div>
                  <div className="h-4 bg-neutral-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'details') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div className="h-8 bg-neutral-300 rounded w-96"></div>
          <div className="flex space-x-3">
            <div className="h-10 w-32 bg-neutral-300 rounded"></div>
            <div className="h-10 w-32 bg-neutral-300 rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-6 bg-neutral-300 rounded w-48 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j}>
                    <div className="h-3 bg-neutral-300 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-neutral-300 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="h-6 bg-neutral-300 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-neutral-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse space-y-4 w-full max-w-md">
        <div className="h-4 bg-neutral-300 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-300 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-300 rounded w-5/6"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
