/**
 * Tiny pub-sub for harness dialogs that need to prompt the maker for a value.
 * Used by shims (e.g. navigation.openForm) so they can `await` a UI response
 * without coupling the shim layer to React. A single <DialogHost /> mounted
 * inside the FluentProvider subscribes and renders the dialogs.
 */

export type DialogRequest =
  | OpenFormDialogRequest
  | LookupDialogRequest;

export interface OpenFormDialogRequest {
  kind: 'openForm';
  id: number;
  options: any;
  parameters?: any;
  resolve: (response: { savedEntityReference: any[] }) => void;
}

export interface LookupDialogRequest {
  kind: 'lookup';
  id: number;
  options: any;
  resolve: (records: any[]) => void;
}

type Listener = (queue: DialogRequest[]) => void;

const queue: DialogRequest[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function notify() {
  // Snapshot to avoid mutation-during-iteration surprises.
  const snapshot = [...queue];
  for (const l of listeners) l(snapshot);
}

export function subscribeDialogs(listener: Listener): () => void {
  listeners.add(listener);
  listener([...queue]);
  return () => {
    listeners.delete(listener);
  };
}

export function pushDialog<T extends DialogRequest>(req: Omit<T, 'id'>): T {
  const full = { ...req, id: nextId++ } as T;
  queue.push(full);
  notify();
  return full;
}

export function resolveDialog(id: number, value: any): void {
  const idx = queue.findIndex(d => d.id === id);
  if (idx < 0) return;
  const [d] = queue.splice(idx, 1);
  notify();
  (d.resolve as (v: any) => void)(value);
}
