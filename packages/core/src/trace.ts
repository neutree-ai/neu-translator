import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseExporter } from "langfuse-vercel";
import { getEnvVariable } from "./env.js";

const exporter = new LangfuseExporter({
  secretKey: getEnvVariable("LANGFUSE_SECRET_KEY"),
  publicKey: getEnvVariable("LANGFUSE_PUBLIC_KEY"),
  baseUrl: getEnvVariable("LANGFUSE_BASE_URL"),
});

export const metricsSdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});
