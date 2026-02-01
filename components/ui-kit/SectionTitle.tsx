import React from 'react';

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-sm font-semibold text-foreground mb-4">
      {children}
    </h1>
  );
}
