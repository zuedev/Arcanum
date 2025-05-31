import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { execSync } from "child_process";

if (process.env.SENTRY_DSN) {
  let version;
  let commit;

  try {
    version =
      execSync("git describe --tags --abbrev=0").toString().trim() || "0.0.0";
  } catch (error) {
    console.error("Failed to get version from git tags:", error);
    version = "0.0.0";
  }

  try {
    commit =
      execSync("git rev-parse --short HEAD").toString().trim() || "0000000";
  } catch (error) {
    console.error("Failed to get commit from git:", error);
    commit = "0000000";
  }

  // initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.ENVIRONMENT,
    release: `arcanum@${version}+${commit}`,
  });

  console.log("Sentry initialized.");
} else {
  console.log("No Sentry DSN provided, skipping Sentry setup.");
}
