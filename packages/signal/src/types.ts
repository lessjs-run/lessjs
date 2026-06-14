/**
 * @openelement/signal - Public type exports.
 *
 * The protocol shape is owned by @openelement/protocol. This package keeps
 * the historical public import path while implementing the concrete engine.
 */

export type {
  ReadonlySignal,
  Signal,
  SignalEngine,
  SignalLike,
  Unsubscribe,
  WritableSignal,
} from '@openelement/protocol/signals';
