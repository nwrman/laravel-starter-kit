import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
  export interface InertiaConfig {
    flashDataType: {
      success?: string;
      error?: string;
      warning?: string;
      info?: string;
    };
    sharedPageProps: {
      name: string;
      auth: Auth;
      sidebarOpen: boolean;
      [key: string]: unknown;
    };
  }
}
