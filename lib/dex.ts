// Backwards-compatible re-export. New code should import from `@/lib/dex/client`.
export {
  dexFetch,
  dexGet,
  dexPost,
  describeDexError,
  DexAuthError,
  DexRequestError,
  type DataEnvelope,
} from './dex/client';
