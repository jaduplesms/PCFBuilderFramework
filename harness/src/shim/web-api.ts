import type { HarnessStore } from '../store/harness-store';

const NETWORK_DELAYS: Record<string, number> = {
  online: 0,
  offline: 0,
  slow3g: 2000,
  fast3g: 500,
  custom: 0,
};

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Parse a single OData condition into a predicate function.
 */
function parseSingleCondition(expr: string): ((e: Record<string, any>) => boolean) | null {
  const trimmed = expr.trim();

  // contains(field,'value')
  const containsMatch = trimmed.match(/^contains\((\w+),\s*'([^']*)'\)$/i);
  if (containsMatch) {
    const [, field, value] = containsMatch;
    return e => String(e[field] ?? '').toLowerCase().includes(value.toLowerCase());
  }

  // field eq null
  const eqNullMatch = trimmed.match(/^(\w+)\s+eq\s+null$/i);
  if (eqNullMatch) {
    const [, field] = eqNullMatch;
    return e => e[field] == null || e[field] === '' || e[field] === 'null';
  }

  // field ne null
  const neNullMatch = trimmed.match(/^(\w+)\s+ne\s+null$/i);
  if (neNullMatch) {
    const [, field] = neNullMatch;
    return e => e[field] != null && e[field] !== '' && e[field] !== 'null';
  }

  // field eq 'value' or field eq guid (unquoted)
  const eqMatch = trimmed.match(/^(\w+)\s+eq\s+'([^']*)'/i) ?? trimmed.match(/^(\w+)\s+eq\s+(\S+)$/i);
  if (eqMatch) {
    const [, field, value] = eqMatch;
    return e => String(e[field]) === value;
  }

  // field ne 'value'
  const neMatch = trimmed.match(/^(\w+)\s+ne\s+'([^']*)'/i) ?? trimmed.match(/^(\w+)\s+ne\s+(\S+)$/i);
  if (neMatch) {
    const [, field, value] = neMatch;
    return e => String(e[field]) !== value;
  }

  // Comparison operators: ge, gt, le, lt (dates, numbers, strings)
  const cmpMatch = trimmed.match(/^(\w+)\s+(ge|gt|le|lt)\s+'?([^']*?)'?$/i);
  if (cmpMatch) {
    const [, field, op, value] = cmpMatch;
    return e => {
      const fieldVal = e[field];
      if (fieldVal == null) return false;
      // Try date comparison first, then numeric, then string
      const dField = new Date(fieldVal).getTime();
      const dValue = new Date(value).getTime();
      if (!isNaN(dField) && !isNaN(dValue)) {
        switch (op.toLowerCase()) {
          case 'ge': return dField >= dValue;
          case 'gt': return dField > dValue;
          case 'le': return dField <= dValue;
          case 'lt': return dField < dValue;
        }
      }
      const nField = Number(fieldVal);
      const nValue = Number(value);
      if (!isNaN(nField) && !isNaN(nValue)) {
        switch (op.toLowerCase()) {
          case 'ge': return nField >= nValue;
          case 'gt': return nField > nValue;
          case 'le': return nField <= nValue;
          case 'lt': return nField < nValue;
        }
      }
      // Fallback: string comparison
      const sField = String(fieldVal);
      switch (op.toLowerCase()) {
        case 'ge': return sField >= value;
        case 'gt': return sField > value;
        case 'le': return sField <= value;
        case 'lt': return sField < value;
      }
      return false;
    };
  }

  // startswith(field,'value')
  const startsMatch = trimmed.match(/^startswith\((\w+),\s*'([^']*)'\)$/i);
  if (startsMatch) {
    const [, field, value] = startsMatch;
    return e => String(e[field] ?? '').toLowerCase().startsWith(value.toLowerCase());
  }

  // endswith(field,'value')
  const endsMatch = trimmed.match(/^endswith\((\w+),\s*'([^']*)'\)$/i);
  if (endsMatch) {
    const [, field, value] = endsMatch;
    return e => String(e[field] ?? '').toLowerCase().endsWith(value.toLowerCase());
  }

  return null;
}

/**
 * Parse a basic OData $filter string into a predicate function.
 * Supports: and, or, eq, ne, eq null, contains, startswith, endswith
 */
function parseFilter(filter: string | undefined): (entity: Record<string, any>) => boolean {
  if (!filter) return () => true;

  // Split on top-level ' and ' first
  const andGroups = filter.split(/ and /i);
  const andPredicates: Array<(e: Record<string, any>) => boolean> = [];

  for (const andGroup of andGroups) {
    // Each AND group may contain OR conditions
    const orParts = andGroup.split(/ or /i);
    const orPredicates: Array<(e: Record<string, any>) => boolean> = [];

    for (const orPart of orParts) {
      const predicate = parseSingleCondition(orPart);
      if (predicate) orPredicates.push(predicate);
    }

    if (orPredicates.length > 0) {
      // OR: at least one must match
      andPredicates.push(entity => orPredicates.some(p => p(entity)));
    }
  }

  // AND: all groups must match
  return (entity) => andPredicates.every(p => p(entity));
}

function parseSelect(select: string | undefined): string[] | null {
  if (!select) return null;
  return select.split(',').map(s => s.trim());
}

function applySelect(entity: Record<string, any>, columns: string[] | null): Record<string, any> {
  if (!columns) return { ...entity };
  const result: Record<string, any> = {};
  for (const col of columns) {
    if (col in entity) result[col] = entity[col];
  }
  return result;
}

/**
 * Creates a WebAPI shim that mirrors the real Dynamics 365 behavior:
 *
 *  context.webAPI  — auto-routes to online or offline store (always works)
 *  webAPI.online   — always hits the server (fails when offline)
 *  webAPI.offline  — always hits the local store (no latency)
 *
 * In the harness, "online store" = data.json + network latency,
 * and "offline store" = data.json with zero latency (instant).
 */
export function createWebApiShim(
  getState: () => HarnessStore,
  getEntityData: (entityType: string) => Record<string, any>[],
) {
  const log = (method: string, args?: any, result?: any) =>
    getState().addLogEntry({ category: 'webAPI', method, args, result });

  /**
   * Apply network latency. In 'online-only' mode, rejects when offline.
   * In 'auto' mode (default for context.webAPI), serves from local store when offline.
   */
  async function applyNetworkConditions(mode: 'auto' | 'online-only' | 'offline-only' = 'auto'): Promise<void> {
    const state = getState();

    if (mode === 'online-only' && state.networkMode === 'offline') {
      throw new Error('Network unavailable — Xrm.WebApi.online called while device is offline');
    }

    // Offline-only mode and auto-mode-when-offline: no latency (instant local store access)
    if (mode === 'offline-only' || state.networkMode === 'offline') {
      return;
    }

    const delayMs = state.networkMode === 'custom'
      ? state.customLatencyMs
      : NETWORK_DELAYS[state.networkMode] ?? 0;
    if (delayMs > 0) await delay(delayMs);
  }

  function estimateSize(obj: any): number {
    try { return JSON.stringify(obj).length; } catch { return 0; }
  }

  // Build CRUD methods parameterized by network mode
  function buildApi(mode: 'auto' | 'online-only' | 'offline-only') {
    const prefix = mode === 'online-only' ? 'online.' : mode === 'offline-only' ? 'offline.' : '';

    return {
      async createRecord(entityType: string, data: Record<string, any>): Promise<any> {
        const start = performance.now();
        log(`${prefix}createRecord`, { entityType, data });
        await applyNetworkConditions(mode);
        const id = crypto.randomUUID();
        const result = { id, entityType };
        getState().addWebApiCall({
          method: `${prefix}createRecord`, entityType, durationMs: performance.now() - start,
          responseSize: estimateSize(result), recordCount: 1,
        });
        return result;
      },

      async deleteRecord(entityType: string, id: string): Promise<any> {
        const start = performance.now();
        log(`${prefix}deleteRecord`, { entityType, id });
        await applyNetworkConditions(mode);
        getState().addWebApiCall({
          method: `${prefix}deleteRecord`, entityType, durationMs: performance.now() - start,
          responseSize: 0, recordCount: 0,
        });
        return { entityType, id };
      },

      async updateRecord(entityType: string, id: string, data: Record<string, any>): Promise<any> {
        const start = performance.now();
        log(`${prefix}updateRecord`, { entityType, id, data });
        await applyNetworkConditions(mode);
        getState().addWebApiCall({
          method: `${prefix}updateRecord`, entityType, durationMs: performance.now() - start,
          responseSize: estimateSize(data), recordCount: 1,
        });
        return { entityType, id };
      },

      async retrieveMultipleRecords(
        entityType: string,
        options?: string,
        maxPageSize?: number,
      ): Promise<{ entities: Record<string, any>[]; nextLink?: string }> {
        const start = performance.now();
        log(`${prefix}retrieveMultipleRecords`, { entityType, options, maxPageSize });
        await applyNetworkConditions(mode);

        let entities = getEntityData(entityType);

        // Parse OData options: ?$filter=...&$select=...&$top=...&$orderby=...
        if (options) {
          const params = new URLSearchParams(options.startsWith('?') ? options.slice(1) : options);
          const filter = params.get('$filter') ?? undefined;
          const select = params.get('$select') ?? undefined;
          const top = params.get('$top');
          const orderby = params.get('$orderby');

          const predicate = parseFilter(filter);
          entities = entities.filter(predicate);

          if (orderby) {
            const [field, dir] = orderby.split(' ');
            const mult = dir?.toLowerCase() === 'desc' ? -1 : 1;
            entities.sort((a, b) => {
              const va = a[field], vb = b[field];
              if (va < vb) return -1 * mult;
              if (va > vb) return 1 * mult;
              return 0;
            });
          }

          if (top) entities = entities.slice(0, parseInt(top, 10));

          const columns = parseSelect(select);
          if (columns) entities = entities.map(e => applySelect(e, columns));
        }

        if (maxPageSize && entities.length > maxPageSize) {
          entities = entities.slice(0, maxPageSize);
        }

        const result = { entities };
        const duration = performance.now() - start;
        const size = estimateSize(result);
        log(`${prefix}retrieveMultipleRecords.result`, { entityType, count: entities.length, durationMs: Math.round(duration), sizeBytes: size });
        getState().addWebApiCall({
          method: `${prefix}retrieveMultipleRecords`, entityType, durationMs: duration,
          responseSize: size, recordCount: entities.length, options,
        });
        return result;
      },

      async retrieveRecord(
        entityType: string,
        id: string,
        options?: string,
      ): Promise<Record<string, any>> {
        const start = performance.now();
        log(`${prefix}retrieveRecord`, { entityType, id, options });
        await applyNetworkConditions(mode);

        const all = getEntityData(entityType);
        // Normalize ID: strip curly braces, lowercase
        const normalId = id.replace(/[{}]/g, '').toLowerCase();

        // Find by common ID field naming patterns
        const record = all.find(e => {
          for (const key of Object.keys(e)) {
            const val = String(e[key] ?? '').replace(/[{}]/g, '').toLowerCase();
            if ((key.toLowerCase().endsWith('id') || key === 'id') && val === normalId) {
              return true;
            }
          }
          return false;
        });

        if (!record) {
          const errMsg = `Record not found: ${entityType}(${id}). Available: ${all.length} records`;
          log(`${prefix}retrieveRecord.notFound`, { entityType, id, availableRecords: all.length });
          getState().addWebApiCall({
            method: `${prefix}retrieveRecord`, entityType, durationMs: performance.now() - start,
            responseSize: 0, recordCount: 0, options, error: errMsg,
          });
          throw new Error(errMsg);
        }

        let result = { ...record };
        if (options) {
          const params = new URLSearchParams(options.startsWith('?') ? options.slice(1) : options);
          const select = parseSelect(params.get('$select') ?? undefined);
          if (select) result = applySelect(record, select);
        }

        const duration = performance.now() - start;
        const size = estimateSize(result);
        log(`${prefix}retrieveRecord.result`, { entityType, id, durationMs: Math.round(duration), sizeBytes: size }, result);
        getState().addWebApiCall({
          method: `${prefix}retrieveRecord`, entityType, durationMs: duration,
          responseSize: size, recordCount: 1, options,
        });
        return result;
      },
    };
  }

  // context.webAPI — auto-routes (works online and offline)
  const autoApi = buildApi('auto');

  // Attach .online and .offline sub-APIs (mirrors Xrm.WebApi.online / Xrm.WebApi.offline)
  return Object.assign(autoApi, {
    online: buildApi('online-only'),
    offline: buildApi('offline-only'),
  });
}
