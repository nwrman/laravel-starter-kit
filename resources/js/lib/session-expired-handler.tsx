import type { RequestPayload } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { SessionExpiredModal } from '@/components/session-expired-modal';

let lastVisit: {
  url: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  data?: RequestPayload;
} | null = null;

let isRetrying = false;

export function initSessionExpiredHandler() {
  // Capture visit details before each request
  router.on('before', (event) => {
    const visit = event.detail.visit;

    lastVisit = {
      url: visit.url.href,
      method: visit.method as 'get' | 'post' | 'put' | 'patch' | 'delete',
      data: visit.data,
    };
  });

  // Handle 419 responses (Inertia v3 renamed 'invalid' to 'httpException')
  router.on('httpException', (event) => {
    const { response } = event.detail;

    if (response.status === 419 && !isRetrying) {
      event.preventDefault();
      void handleSessionExpired();
    }
  });
}

async function handleSessionExpired() {
  try {
    // Attempt to refresh CSRF token
    const tokenResponse = await fetch('/csrf-token', {
      method: 'GET',
      credentials: 'include',
    });

    if (!tokenResponse.ok) {
      throw new Error('Token refresh failed');
    }

    // Check if user is still authenticated after token refresh
    // This catches the case where session is completely gone
    const authCheckResponse = await fetch('/auth-check', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!authCheckResponse.ok) {
      // User is not authenticated — session truly expired
      throw new Error('Session expired');
    }

    // User is still authenticated — retry the original request
    if (lastVisit) {
      isRetrying = true;

      const { url, method, data } = lastVisit;

      const options = {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => {
          isRetrying = false;
        },
        onError: () => {
          isRetrying = false;
        },
      };

      try {
        if (method === 'get') {
          router.get(url, data, options);
        } else if (method === 'post') {
          router.post(url, data, options);
        } else if (method === 'put') {
          router.put(url, data, options);
        } else if (method === 'patch') {
          router.patch(url, data, options);
        } else if (method === 'delete') {
          router.delete(url, options);
        } else {
          // Unknown method — reset and fall through to modal
          isRetrying = false;
          showSessionExpiredModal();
        }
      } catch {
        isRetrying = false;
        showSessionExpiredModal();
      }

      return;
    }
  } catch {
    // Token refresh failed or user not authenticated
  }

  // Session truly expired — show modal
  isRetrying = false;
  showSessionExpiredModal();
}

function showSessionExpiredModal() {
  const container = document.createElement('div');
  container.id = 'session-expired-modal-root';
  document.body.appendChild(container);

  const root = createRoot(container);

  const handleConfirm = () => {
    root.unmount();
    container.remove();
    // Include current URL so user is redirected back after login
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  };

  root.render(<SessionExpiredModal onConfirm={handleConfirm} open={true} />);
}
