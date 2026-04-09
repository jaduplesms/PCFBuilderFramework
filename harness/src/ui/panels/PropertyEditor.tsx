import { useCallback } from 'react';
import {
  makeStyles, tokens, Input, Label, Switch, SpinButton, Textarea,
  Divider, Badge,
} from '@fluentui/react-components';
import type { ManifestConfig, ManifestProperty } from '../../types/manifest';
import { useHarnessStore } from '../../store/harness-store';
import { ControlInfoCard } from './ControlInfoCard';

const useStyles = makeStyles({
  root: {
    padding: '12px',
    overflowY: 'auto',
    height: '100%',
  },
  header: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '12px',
  },
  field: {
    marginBottom: '12px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  typeHint: {
    fontSize: '10px',
    opacity: 0.6,
    fontWeight: 'normal' as const,
  },
  lookupGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
});

function PropertyField({ prop, manifest }: { prop: ManifestProperty; manifest: ManifestConfig }) {
  const styles = useStyles();
  const value = useHarnessStore(s => s.propertyValues[prop.name]);
  const setValue = useHarnessStore(s => s.setPropertyValue);

  const handleTextChange = useCallback((_: any, data: { value: string }) => {
    setValue(prop.name, data.value || null);
  }, [prop.name, setValue]);

  const handleNumberChange = useCallback((_: any, data: { value?: number | null; displayValue?: string }) => {
    setValue(prop.name, data.value ?? null);
  }, [prop.name, setValue]);

  const handleSwitchChange = useCallback((_: any, data: { checked: boolean }) => {
    setValue(prop.name, data.checked);
  }, [prop.name, setValue]);

  const usageBadge = prop.usage === 'bound'
    ? <Badge appearance="filled" color="brand" size="small">bound</Badge>
    : <Badge appearance="outline" size="small">input</Badge>;

  switch (prop.ofType) {
    case 'Lookup.Simple': {
      const lookup = value as any;
      return (
        <div className={styles.field}>
          <div className={styles.label}>
            {prop.displayNameKey} {usageBadge}
            <span className={styles.typeHint}>{prop.ofType}</span>
          </div>
          <div className={styles.lookupGroup}>
            <Input
              size="small"
              placeholder="ID (GUID)"
              value={lookup?.[0]?.id ?? ''}
              onChange={(_, d) => {
                if (!d.value) {
                  setValue(prop.name, null);
                } else {
                  setValue(prop.name, [{
                    id: d.value,
                    name: lookup?.[0]?.name ?? '',
                    entityType: lookup?.[0]?.entityType ?? '',
                  }]);
                }
              }}
            />
            <Input
              size="small"
              placeholder="Display Name"
              value={lookup?.[0]?.name ?? ''}
              onChange={(_, d) => {
                if (lookup?.[0]) {
                  setValue(prop.name, [{ ...lookup[0], name: d.value }]);
                }
              }}
            />
            <Input
              size="small"
              placeholder="Entity Type"
              value={lookup?.[0]?.entityType ?? ''}
              onChange={(_, d) => {
                if (lookup?.[0]) {
                  setValue(prop.name, [{ ...lookup[0], entityType: d.value }]);
                }
              }}
            />
          </div>
        </div>
      );
    }

    case 'TwoOptions':
      return (
        <div className={styles.field}>
          <div className={styles.label}>
            {prop.displayNameKey} {usageBadge}
            <span className={styles.typeHint}>{prop.ofType}</span>
          </div>
          <Switch checked={value ?? false} onChange={handleSwitchChange} />
        </div>
      );

    case 'Whole.None':
    case 'FP':
    case 'Decimal':
    case 'Currency':
      return (
        <div className={styles.field}>
          <div className={styles.label}>
            {prop.displayNameKey} {usageBadge}
            <span className={styles.typeHint}>{prop.ofType}</span>
          </div>
          <SpinButton
            size="small"
            value={value ?? 0}
            onChange={handleNumberChange}
          />
        </div>
      );

    case 'Multiple':
      return (
        <div className={styles.field}>
          <div className={styles.label}>
            {prop.displayNameKey} {usageBadge}
            <span className={styles.typeHint}>{prop.ofType}</span>
          </div>
          <Textarea
            size="small"
            value={value ?? ''}
            onChange={handleTextChange}
            resize="vertical"
          />
        </div>
      );

    default:
      // SingleLine.Text and all other string types
      return (
        <div className={styles.field}>
          <div className={styles.label}>
            {prop.displayNameKey} {usageBadge}
            <span className={styles.typeHint}>{prop.ofType}</span>
          </div>
          <Input
            size="small"
            value={value ?? ''}
            onChange={handleTextChange}
            placeholder={prop.descriptionKey || prop.name}
          />
        </div>
      );
  }
}

interface Props {
  manifest: ManifestConfig;
}

export function PropertyEditor({ manifest }: Props) {
  const styles = useStyles();
  const pageEntityId = useHarnessStore(s => s.pageEntityId);
  const pageEntityTypeName = useHarnessStore(s => s.pageEntityTypeName);
  const setPageEntityId = useHarnessStore(s => s.setPageEntityId);
  const setPageEntityTypeName = useHarnessStore(s => s.setPageEntityTypeName);

  const boundProps = manifest.properties.filter(p => p.usage === 'bound');
  const inputProps = manifest.properties.filter(p => p.usage === 'input');

  return (
    <div className={styles.root}>
      <ControlInfoCard manifest={manifest} />

      {/* Page Context — for controls that read context.page.entityId */}
      <Label size="small" weight="semibold" style={{ opacity: 0.6 }}>Page Context</Label>
      <div className={styles.field}>
        <div className={styles.label}>
          Entity Type Name
          <span className={styles.typeHint}>context.page.entityTypeName</span>
        </div>
        <Input
          size="small"
          placeholder="e.g. msdyn_workorderservicetask"
          value={pageEntityTypeName}
          onChange={(_, d) => setPageEntityTypeName(d.value)}
        />
      </div>
      <div className={styles.field}>
        <div className={styles.label}>
          Entity ID
          <span className={styles.typeHint}>context.page.entityId</span>
        </div>
        <Input
          size="small"
          placeholder="Record GUID"
          value={pageEntityId}
          onChange={(_, d) => setPageEntityId(d.value)}
        />
      </div>
      <Divider style={{ margin: '8px 0' }} />

      <div className={styles.header}>Properties</div>

      {boundProps.length > 0 && (
        <>
          <Label size="small" weight="semibold" style={{ opacity: 0.6 }}>Bound Properties</Label>
          {boundProps.map(p => (
            <PropertyField key={p.name} prop={p} manifest={manifest} />
          ))}
        </>
      )}

      {inputProps.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Label size="small" weight="semibold" style={{ opacity: 0.6 }}>Input Properties</Label>
          {inputProps.map(p => (
            <PropertyField key={p.name} prop={p} manifest={manifest} />
          ))}
        </>
      )}
    </div>
  );
}
