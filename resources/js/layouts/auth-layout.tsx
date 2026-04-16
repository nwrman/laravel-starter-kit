import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import AuthLayoutTemplate from '@/layouts/auth/auth-card-layout';

export default function AuthLayout({
  children,
  title,
  description,
  ...props
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <AuthLayoutTemplate title={title} description={description} {...props}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AuthLayoutTemplate>
  );
}
