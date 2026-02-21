import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://ad919c2d1a381bdf45dd169f6ac6ab77@o4510925704003584.ingest.us.sentry.io/4510925714096128',

  // Capture 10% of transactions for performance monitoring (adjust as needed)
  tracesSampleRate: 0.1,

  // Capture replays for 10% of sessions, 100% on errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});
