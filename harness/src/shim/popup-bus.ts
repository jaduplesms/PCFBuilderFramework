/**
 * Popup registry/bus used by `context.factory.getPopupService()`.
 *
 * Mirrors the runtime PCF popup contract:
 *   - createPopup(popup)            register a popup definition
 *   - openPopup(name) / closePopup  toggle visibility
 *   - updatePopup(popup)            patch an existing definition
 *   - deletePopup(name)             unregister
 *   - setPopupsId / getPopupsId     parent id for nested popups (host-managed)
 *
 * PopupHost subscribes to changes and renders all currently-open popups.
 */

export type PopupType = 1 | 2 | 3; // 1=Custom, 2=ModelessOverlay, 3=ModalDialog (matches XrmEnum.PopupType)

export interface Popup {
  name: string;
  popupType?: PopupType;
  content?: string;
  closeOnOutsideClick?: boolean;
  position?: { top?: number; left?: number; right?: number; bottom?: number };
  onShown?: () => void;
  onHidden?: () => void;
}

export interface PopupEntry extends Popup {
  open: boolean;
}

let popups: Record<string, PopupEntry> = {};
let popupsId = '';
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function subscribePopups(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPopupsState(): { popups: Record<string, PopupEntry>; popupsId: string } {
  return { popups, popupsId };
}

export function createPopupEntry(popup: Popup): void {
  popups = { ...popups, [popup.name]: { ...popup, open: false } };
  notify();
}

export function openPopupEntry(name: string): void {
  const existing = popups[name];
  if (!existing) return;
  popups = { ...popups, [name]: { ...existing, open: true } };
  notify();
  existing.onShown?.();
}

export function closePopupEntry(name: string): void {
  const existing = popups[name];
  if (!existing) return;
  popups = { ...popups, [name]: { ...existing, open: false } };
  notify();
  existing.onHidden?.();
}

export function updatePopupEntry(popup: Popup): void {
  const existing = popups[popup.name];
  if (!existing) return;
  popups = { ...popups, [popup.name]: { ...existing, ...popup } };
  notify();
}

export function deletePopupEntry(name: string): void {
  if (!(name in popups)) return;
  const next = { ...popups };
  delete next[name];
  popups = next;
  notify();
}

export function setPopupsIdValue(id: string): void {
  popupsId = id;
  notify();
}

export function getPopupsIdValue(): string {
  return popupsId;
}
