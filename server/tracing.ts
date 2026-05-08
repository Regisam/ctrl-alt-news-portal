import { NodeSDK } from '@opentelemetry/sdk-node';
// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';
// import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace } from '@opentelemetry/api';

let sdk: NodeSDK | null = null;

export function initializeTracing(): () => Promise<void> {
  // OTLP exporter sends traces to Jaeger
  const otlpExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  // Sampler: 100% in dev, 10% in production
  const samplingRate = process.env.NODE_ENV === 'development' ? 1.0 : 0.1;

  // Initialize SDK (auto-instrumentation removed to reduce overhead)
  sdk = new NodeSDK({
    serviceName: 'ctrl-alt-news-server',
    traceExporter: otlpExporter,
    instrumentations: [],
    sampler: new TraceIdRatioBasedSampler(samplingRate),
  });

  // Start SDK
  sdk.start();
  console.log(`[Tracing] OpenTelemetry initialized (sampling: ${Math.round(samplingRate * 100)}%, service: ctrl-alt-news-server)`);

  // Return shutdown function
  return async () => {
    if (sdk) {
      await sdk.shutdown();
      console.log('[Tracing] OpenTelemetry shutdown complete');
    }
  };
}

// Get tracer instance for creating custom spans
export function getTracer() {
  return trace.getTracer('ctrl-alt-news-app', '1.0.0');
}

// Helper: Generate request ID if not present
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Extract request ID from headers or generate new one
export function getOrGenerateRequestId(headers?: Record<string, string>): string {
  const requestId = headers?.['x-request-id'] || headers?.['x-trace-id'];
  return requestId || generateRequestId();
}

// Helper: Add baggage (context data) to current span
export function addBaggage(key: string, value: string): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}
