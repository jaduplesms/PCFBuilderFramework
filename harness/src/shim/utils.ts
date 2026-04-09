import type { HarnessStore } from '../store/harness-store';

export function createUtilsShim(getState: () => HarnessStore) {
  const log = (method: string, args?: any) =>
    getState().addLogEntry({ category: 'utils', method, args });

  return {
    getEntityMetadata(entityName: string, attributes?: string[]): Promise<any> {
      log('getEntityMetadata', { entityName, attributes });
      return Promise.resolve({
        LogicalName: entityName,
        EntitySetName: entityName + 's',
        DisplayName: entityName,
        PrimaryIdAttribute: entityName + 'id',
        PrimaryNameAttribute: 'name',
        Attributes: {
          getAll() {
            return (attributes ?? []).map(a => ({
              LogicalName: a,
              DisplayName: a,
              AttributeType: 'String',
            }));
          },
          getByName(name: string) {
            return { LogicalName: name, DisplayName: name, AttributeType: 'String' };
          },
        },
      });
    },
    hasEntityPrivilege(
      _entityTypeName: string,
      _privilegeType: number,
      _privilegeDepth: number
    ): boolean {
      return true;
    },
    lookupObjects(lookupOptions: any): Promise<any[]> {
      log('lookupObjects', lookupOptions);
      return Promise.resolve([]);
    },
  };
}
