import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

if (process.env.SENTRY_DSN) {
  // initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
  });

  // start profiling
  Sentry.profiler.startProfiler();
} else {
  console.log("No Sentry DSN provided, skipping Sentry setup.");
}
