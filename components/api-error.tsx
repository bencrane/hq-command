'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Copy, RefreshCw, X } from 'lucide-react';
import { ApiError, apiErrorSummary } from '@/lib/api-error';

interface Props {
  error: unknown;
  /**
   * If true, render a compact one-line summary instead of the full envelope
   * (suitable for client-facing UI where request_id / type aren't useful).
   */
  compact?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Renders an hq-x error envelope in full: status + error code, message, the
 * method/path/request_id diagnostic row, validation field errors, and DMaaS
 * solver conflicts. Includes a copy-JSON button for bug reports.
 */
export function ApiErrorDisplay({ error, compact, onRetry, onDismiss, className }: Props) {
  if (compact) {
    return (
      <CompactBanner
        message={apiErrorSummary(error)}
        onRetry={onRetry}
        onDismiss={onDismiss}
        className={className}
      />
    );
  }

  if (!(error instanceof ApiError)) {
    // Non-ApiError fallback (rare — apiFetch wraps network failures).
    const message = error instanceof Error ? error.message : String(error);
    return (
      <Shell onRetry={onRetry} onDismiss={onDismiss} className={className}>
        <Heading status={null} code={null} statusText="Error" />
        <Body>{message}</Body>
      </Shell>
    );
  }

  const { status, statusText, detail, raw, rawText, hasEnvelope, url } = error;
  const isString = typeof detail === 'string';
  const isObject = !isString && detail !== null && typeof detail === 'object';

  // Heading: prefer envelope error code, fall back to upstream statusText, then
  // a generic "error" — never invent something that looks like a real code.
  const code = hasEnvelope && isObject ? (detail.error ?? null) : null;
  const message = isString ? detail : isObject ? detail.message : undefined;
  const method = isObject ? detail.method : undefined;
  const path = isObject ? detail.path : undefined;
  const requestId = isObject ? detail.request_id : undefined;
  const exceptionType = isObject ? detail.type : undefined;
  const fieldErrors =
    hasEnvelope && isObject && Array.isArray(detail.errors) ? detail.errors : null;
  const conflicts =
    hasEnvelope && isObject && Array.isArray(detail.conflicts) ? detail.conflicts : null;

  // Surface remaining detail keys we didn't explicitly pull out (only when the
  // body matches the envelope shape — otherwise the whole body goes in the
  // "Raw response" section instead).
  const extra = hasEnvelope && isObject ? extraEntries(detail) : null;

  // Body content selection (in priority order):
  //   1. If we have an explicit message, use it.
  //   2. If we have an envelope object but no message, pretty-print it.
  //   3. Otherwise we DON'T have an envelope — fall through to the "Raw
  //      response" section below so we don't dress up a non-envelope body
  //      as if it were a structured error.
  let bodyContent: React.ReactNode = null;
  if (message) {
    bodyContent = message;
  } else if (hasEnvelope && isObject) {
    const json = JSON.stringify(detail, null, 2);
    bodyContent = json.length > 600 ? json.slice(0, 600) + '…' : json;
  }

  return (
    <Shell onRetry={onRetry} onDismiss={onDismiss} className={className}>
      <Heading
        status={status === 0 ? null : status}
        code={code}
        statusText={
          status === 0
            ? "Couldn't reach server"
            : statusText || (status ? `HTTP ${status}` : 'error')
        }
      />
      {bodyContent && <Body>{bodyContent}</Body>}

      {!hasEnvelope && (rawText || raw != null) && (
        <RawResponse rawText={rawText} raw={raw} />
      )}

      {(method || path || requestId || exceptionType) && (
        <Diagnostics>
          {method && path && (
            <span>
              <span className="opacity-70">{method}</span> {path}
            </span>
          )}
          {exceptionType && (
            <span>
              <span className="opacity-70">type:</span> {exceptionType}
            </span>
          )}
          {requestId && (
            <span>
              <span className="opacity-70">request_id:</span> <code>{requestId}</code>
            </span>
          )}
          {status === 0 && url && (
            <span>
              <span className="opacity-70">url:</span> {url}
            </span>
          )}
        </Diagnostics>
      )}

      {fieldErrors && fieldErrors.length > 0 && (
        <Subsection title="Field errors">
          {fieldErrors.map((e, i) => (
            <li key={i} className="font-mono">
              {Array.isArray(e.loc) ? e.loc.join('.') : '?'}: {e.msg ?? '(no message)'}
              {e.type && (
                <span className="ml-1 opacity-60">[{e.type}]</span>
              )}
            </li>
          ))}
        </Subsection>
      )}

      {conflicts && conflicts.length > 0 && (
        <Subsection title="Constraint conflicts">
          {conflicts.map((c, i) => (
            <li key={i}>
              <span className="font-mono opacity-70">[{c.phase ?? '?'}]</span>{' '}
              <span className="font-mono">{c.constraint_type ?? '?'}</span>:{' '}
              {c.message ?? JSON.stringify(c)}
            </li>
          ))}
        </Subsection>
      )}

      {extra && extra.length > 0 && (
        <Subsection title="Other">
          {extra.map(([k, v]) => (
            <li key={k} className="font-mono">
              {k}: {formatValue(v)}
            </li>
          ))}
        </Subsection>
      )}

      <CopyButton raw={raw} fallback={detail} />
    </Shell>
  );
}

const SKIP_KEYS = new Set([
  'error',
  'type',
  'message',
  'request_id',
  'method',
  'path',
  'retryable',
  'errors',
  'conflicts',
]);

function extraEntries(
  detail: Exclude<ApiError['detail'], string | null>,
): [string, unknown][] {
  return Object.entries(detail).filter(([k, v]) => !SKIP_KEYS.has(k) && v != null);
}

function formatValue(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function Shell({
  children,
  onRetry,
  onDismiss,
  className,
}: {
  children: React.ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={
        'flex flex-col gap-2 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-3 py-2.5 text-[12.5px] text-[var(--color-danger)] ' +
        (className ?? '')
      }
    >
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">{children}</div>
        <div className="flex shrink-0 items-center gap-1">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry"
              className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <RefreshCw size={13} />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Heading({
  status,
  code,
  statusText,
}: {
  status: number | null;
  code: string | null;
  statusText: string;
}) {
  const label = code ?? statusText;
  return (
    <div className="text-[13px] font-medium">
      {status != null && <span className="font-mono">{status}</span>}
      {status != null && ' — '}
      <span className="font-mono">{label}</span>
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div className="whitespace-pre-wrap break-words text-[12.5px] text-[var(--color-danger)]/90">
      {children}
    </div>
  );
}

function Diagnostics({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-[var(--color-danger)]/80">
      {children}
    </div>
  );
}

function RawResponse({ rawText, raw }: { rawText: string; raw: unknown }) {
  // Prefer pretty-printed JSON when the body parsed successfully. Otherwise
  // show the raw text — even if it's HTML or a stack trace, that's still
  // more useful than a synthesized fallback.
  let display = rawText;
  if (raw != null && typeof raw === 'object') {
    try {
      display = JSON.stringify(raw, null, 2);
    } catch {
      /* keep rawText */
    }
  }
  if (!display) {
    return (
      <div className="text-[11.5px] italic opacity-70">(empty response body)</div>
    );
  }
  const truncated = display.length > 1200 ? display.slice(0, 1200) + '\n…' : display;
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-medium uppercase tracking-[1.2px] opacity-70">
        Raw response
      </div>
      <pre className="max-h-[300px] overflow-auto rounded border border-[var(--color-danger)]/20 bg-[var(--color-surface-0)]/50 p-2 font-mono text-[10.5px] leading-relaxed text-[var(--color-danger)]/90">
        {truncated}
      </pre>
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-medium uppercase tracking-[1.2px] opacity-70">
        {title}
      </div>
      <ul className="ml-3 list-disc space-y-0.5 text-[11.5px]">{children}</ul>
    </div>
  );
}

function CopyButton({ raw, fallback }: { raw: unknown; fallback: unknown }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const text = JSON.stringify(raw ?? fallback, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — silent */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-1 inline-flex items-center gap-1 self-start rounded border border-[var(--color-danger)]/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors hover:bg-[var(--color-danger)]/10"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'copied' : 'copy json'}
    </button>
  );
}

/** Compact one-line variant. */
function CompactBanner({
  message,
  onRetry,
  onDismiss,
  className,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={
        'flex items-start gap-3 border-b border-[var(--color-danger)]/30 bg-[var(--color-danger-muted)] px-6 py-2.5 text-[13px] text-[var(--color-danger)] ' +
        (className ?? '')
      }
    >
      <AlertTriangle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
      <div className="flex-1">{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry"
          className="opacity-70 transition-opacity hover:opacity-100"
        >
          <RefreshCw size={14} strokeWidth={2} />
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="opacity-70 transition-opacity hover:opacity-100"
        >
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
