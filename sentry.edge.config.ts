import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://ad919c2d1a381bdf45dd169f6ac6ab77@o4510925704003584.ingest.us.sentry.io/4510925714096128',

  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === 'production',
});
