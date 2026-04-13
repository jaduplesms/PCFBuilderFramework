/**
 * Entity metadata store.
 *
 * Supports TWO formats:
 *
 * 1. Dataverse API format (raw response from EntityDefinitions endpoint):
 *    Save the response from:
 *    GET /api/data/v9.2/EntityDefinitions?$filter=LogicalName eq '{entity}'
 *        &$select=LogicalName,DisplayName
 *        &$expand=Attributes($select=LogicalName,DisplayName,AttributeType)
 *
 * 2. Simple format (hand-authored):
 *    { "entityName": { "displayName": "...", "columns": { "col": { "displayName": "...", "type": "..." } } } }
 *
 * The harness auto-detects the format and normalises to the simple format.
 */

export interface ColumnMetadata {
  displayName: string;
  type?: string;
}

export interface EntityMetadata {
  displayName: string;
  columns: Record<string, ColumnMetadata>;
}

let metadataStore: Record<string, EntityMetadata> = {};

/**
 * Load metadata, auto-detecting Dataverse API format vs simple format.
 */
export function loadMetadata(data: any): void {
  if (!data || typeof data !== 'object') return;

  // Detect Dataverse API format: has "value" array with Attributes
  if (Array.isArray(data.value) && data.value.length > 0 && data.value[0].Attributes) {
    parseDataverseFormat(data);
    return;
  }

  // Check if it's an array of Dataverse responses (multiple files merged)
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.value) {
        parseDataverseFormat(item);
      }
    }
    return;
  }

  // Simple format — use directly, but validate structure
  for (const [key, val] of Object.entries(data)) {
    const entity = val as any;
    if (entity.displayName && entity.columns) {
      metadataStore[key] = entity;
    } else if (entity.Attributes) {
      // Single entity in Dataverse format without the "value" wrapper
      parseDataverseEntity(entity);
    }
  }
}

function parseDataverseFormat(data: any): void {
  for (const entity of data.value) {
    parseDataverseEntity(entity);
  }
}

function parseDataverseEntity(entity: any): void {
  const logicalName = entity.LogicalName;
  if (!logicalName) return;

  const displayLabel = entity.DisplayName?.UserLocalizedLabel;
  const displayName = displayLabel?.Label ?? logicalName;

  const columns: Record<string, ColumnMetadata> = {};
  for (const attr of (entity.Attributes ?? [])) {
    const attrLogical = attr.LogicalName;
    const attrLabel = attr.DisplayName?.UserLocalizedLabel;
    if (!attrLabel?.Label) continue; // Skip internal fields with no display name

    columns[attrLogical] = {
      displayName: attrLabel.Label,
      type: attr.AttributeType,
    };
  }

  metadataStore[logicalName] = { displayName, columns };
}

export function getEntityMetadata(entityType: string): EntityMetadata | null {
  return metadataStore[entityType] ?? null;
}

export function getColumnDisplayName(entityType: string, columnName: string): string | null {
  const entity = metadataStore[entityType];
  if (!entity) return null;
  return entity.columns[columnName]?.displayName ?? null;
}

export function getEntityDisplayName(entityType: string): string | null {
  return metadataStore[entityType]?.displayName ?? null;
}
