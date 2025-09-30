import { Injectable } from '@nestjs/common';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

@Injectable()
export class TelemetryService {
  private readonly tracer = trace.getTracer('ifrs15-api');

  async traceAsyncOperation<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes,
    });

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await operation();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  traceOperation<T>(
    name: string,
    operation: () => T,
    attributes?: Record<string, string | number | boolean>
  ): T {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes,
    });

    return context.with(trace.setSpan(context.active(), span), () => {
      try {
        const result = operation();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
