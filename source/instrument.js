import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { execSync } from "child_process";

if (process.env.SENTRY_DSN) {
  const version =
    execSync("git describe --tags --abbrev=0").toString().trim() || "0.0.0";
  const commit =
    execSync("git rev-parse --short HEAD").toString().trim() || "0000000";

  // initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    environment: process.env.ENVIRONMENT,
    release: `arcanum@${version}+${commit}`,
  });

  // start profiling
  Sentry.profiler.startProfiler();
} else {
  console.log("No Sentry DSN provided, skipping Sentry setup.");
}
