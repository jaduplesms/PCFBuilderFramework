// Minimal Xrm.Page.ui form-notification simulator for the PCF harness.
//
// Real model-driven forms expose:
//   Xrm.Page.ui.setFormNotification(message, level, uniqueId): boolean
//   Xrm.Page.ui.clearFormNotification(uniqueId): boolean
// where level is 'ERROR' | 'WARNING' | 'INFORMATION'.
//
// We mirror that contract and back it with a small pub/sub store the
// `<FormNotificationBanner />` UI subscribes to. PCFs that already call
// these APIs (e.g. InspectionReportButton) will surface notifications in
// the harness exactly as they would on a real form.

export type FormNotificationLevel = 'ERROR' | 'WARNING' | 'INFORMATION';

export interface FormNotification {
    id: string;
    level: FormNotificationLevel;
    message: string;
}

type Listener = (items: readonly FormNotification[]) => void;

const notifications = new Map<string, FormNotification>();
const listeners = new Set<Listener>();

function emit(): void {
    const snapshot: readonly FormNotification[] = Array.from(notifications.values());
    listeners.forEach((l) => {
        try {
            l(snapshot);
        } catch (e) {
            console.error('[pcf-workbench] form-notification listener error', e);
        }
    });
}

export function subscribeFormNotifications(listener: Listener): () => void {
    listeners.add(listener);
    listener(Array.from(notifications.values()));
    return () => {
        listeners.delete(listener);
    };
}

export function getFormNotifications(): readonly FormNotification[] {
    return Array.from(notifications.values());
}

export function dismissFormNotification(id: string): void {
    if (notifications.delete(id)) emit();
}

function setFormNotification(message: string, level: string, uniqueId: string): boolean {
    if (typeof message !== 'string' || typeof uniqueId !== 'string' || uniqueId.length === 0) return false;
    const normalized: FormNotificationLevel =
        level === 'WARNING' || level === 'INFORMATION' ? level : 'ERROR';
    notifications.set(uniqueId, { id: uniqueId, level: normalized, message });
    emit();
    return true;
}

function clearFormNotification(uniqueId: string): boolean {
    if (typeof uniqueId !== 'string') return false;
    const existed = notifications.delete(uniqueId);
    if (existed) emit();
    return existed;
}

/**
 * Install a minimal `window.Xrm.Page.ui` shim so PCFs that follow the
 * model-driven form-notification pattern work in the harness. Idempotent.
 */
export function installXrmFormShim(): void {
    const w = window as unknown as { Xrm?: any };
    if (!w.Xrm) w.Xrm = {};
    if (!w.Xrm.Page) w.Xrm.Page = {};
    if (!w.Xrm.Page.ui) w.Xrm.Page.ui = {};
    const ui = w.Xrm.Page.ui;
    if (typeof ui.setFormNotification !== 'function') ui.setFormNotification = setFormNotification;
    if (typeof ui.clearFormNotification !== 'function') ui.clearFormNotification = clearFormNotification;
    console.log('[pcf-workbench] Xrm.Page.ui form-notification shim installed');
}
