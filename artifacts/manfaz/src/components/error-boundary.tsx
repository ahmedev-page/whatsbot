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
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
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
    <div dir="rtl" className="grain flex min-h-[100dvh] w-full items-center justify-center bg-[#fff8ee] p-6">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center"><Brand /></div>
        <span className="mx-auto mt-14 grid size-16 place-items-center rounded-2xl bg-[#f9e0d8] text-[#a34838]"><TriangleAlert size={25} /></span>
        <h1 className="mt-6 font-serif text-2xl font-bold text-[#1b2735]">
          حدث عطل غير متوقع
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#69777d]">
          لم تسر هذه الخطوة كما ينبغي. جرّب مرة أخرى، وORxai سيعود للعمل.
        </p>
        {/* Dev only: messages can carry API responses and other internals. */}
        {import.meta.env.DEV ? (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[#f2eee6] p-3 text-left text-xs text-[#69777d]">
            {error.message || String(error)}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={resetError}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1b2735] px-5 py-3 text-sm font-bold text-[#fff8ee] transition-transform hover:-translate-y-0.5"
          data-testid="button-error-retry"
        >
          حاول مرة أخرى <RotateCcw size={15} />
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
