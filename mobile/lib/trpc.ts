import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../../server/routers';

export const trpc = createTRPCReact<AppRouter>();

// Backend API URL - update this to your deployed backend or local IP
// For local development, use your computer's IP address (not localhost)
// Example: http://192.168.1.100:3000/api/trpc
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/trpc';

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: API_URL,
      transformer: superjson,
      headers() {
        return {
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});
