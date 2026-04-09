/**
 * In-memory entity data store.
 * Loaded from data.json in the PCF project directory (if present).
 * Falls back to empty collections.
 */

let entityStore: Record<string, Record<string, any>[]> = {};

export function loadEntityData(data: Record<string, any[]>): void {
  entityStore = { ...data };
}

export function getEntityData(entityType: string): Record<string, any>[] {
  return entityStore[entityType] ?? [];
}

export function getEntityStoreKeys(): string[] {
  return Object.keys(entityStore);
}

export function clearEntityData(): void {
  entityStore = {};
}
