import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Brand } from '@/components/brand';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F8FAFC] p-6 font-sans text-[#0F172A]"
      style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-[#CBD5E1] bg-white p-8 text-center shadow-[0_24px_60px_-24px_rgba(15,23,42,0.12)] sm:p-10"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
      >
        <div className="flex justify-center">
          <Brand />
        </div>
        <span
          className="mx-auto mt-8 grid size-16 place-items-center rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] text-[#E11D48]"
          style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3', color: '#E11D48' }}
        >
          <TriangleAlert size={26} />
        </span>
        <h1
          className="mt-6 text-2xl font-black tracking-tight text-[#0F172A]"
          style={{ color: '#0F172A' }}
        >
          حدث عطل غير متوقع في الصفحة
        </h1>
        <p
          className="mt-3 text-sm font-medium leading-7 text-[#475569]"
          style={{ color: '#475569' }}
        >
          لم تكتمل هذه الخطوة كما ينبغي. اضغط على إعادة المحاولة لاستئناف العمل في استوديو ORxai.
        </p>
        {import.meta.env.DEV ? (
          <pre
            className="mt-4 overflow-x-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-left font-mono text-xs text-[#334155]"
            style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#334155' }}
          >
            {error.message || String(error)}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={resetError}
          className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1E40AF]"
          style={{ backgroundColor: '#1D4ED8', color: '#FFFFFF' }}
          data-testid="button-error-retry"
        >
          <span>إعادة المحاولة الآن</span>
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
