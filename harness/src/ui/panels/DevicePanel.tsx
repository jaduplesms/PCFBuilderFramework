import {
  makeStyles, tokens, RadioGroup, Radio, Input, Switch, Label, Dropdown, Option,
} from '@fluentui/react-components';
import { useHarnessStore, DEVICE_PRESETS } from '../../store/harness-store';

const useStyles = makeStyles({
  root: {
    padding: '12px',
  },
  header: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '8px',
  },
  section: {
    marginTop: '16px',
  },
  sizeRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  sizeField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: '1 1 100px',
    minWidth: 0,
  },
  info: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '8px',
  },
});

export function DevicePanel() {
  const styles = useStyles();
  const devicePreset = useHarnessStore(s => s.devicePreset);
  const viewportWidth = useHarnessStore(s => s.viewportWidth);
  const viewportHeight = useHarnessStore(s => s.viewportHeight);
  const formFactor = useHarnessStore(s => s.formFactor);
  const setDevicePreset = useHarnessStore(s => s.setDevicePreset);
  const containerWidth = useHarnessStore(s => s.containerWidth);
  const containerHeight = useHarnessStore(s => s.containerHeight);
  const setContainerWidth = useHarnessStore(s => s.setContainerWidth);
  const setContainerHeight = useHarnessStore(s => s.setContainerHeight);
  const host = useHarnessStore(s => s.host);
  const setHost = useHarnessStore(s => s.setHost);

  const formFactorLabel = formFactor === 1 ? 'Desktop' : formFactor === 2 ? 'Tablet' : 'Phone';
  const customSizeEnabled = containerWidth != null || containerHeight != null;

  const toggleCustomSize = (enabled: boolean) => {
    if (enabled) {
      setContainerWidth(containerWidth ?? viewportWidth);
      setContainerHeight(containerHeight ?? viewportHeight);
    } else {
      setContainerWidth(null);
      setContainerHeight(null);
    }
  };

  const parseSize = (value: string): number | null => {
    if (value.trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>Device Emulation</div>
      <RadioGroup
        value={devicePreset}
        onChange={(_, data) => setDevicePreset(data.value)}
      >
        {Object.entries(DEVICE_PRESETS).map(([key, preset]) => (
          <Radio
            key={key}
            value={key}
            label={`${preset.name} (${preset.width}x${preset.height})`}
          />
        ))}
      </RadioGroup>
      <div className={styles.info}>
        Viewport: {viewportWidth} x {viewportHeight} | Form Factor: {formFactorLabel} ({formFactor})
      </div>

      <div className={styles.section}>
        <div className={styles.header}>Host</div>
        <Dropdown
          size="small"
          selectedOptions={[host]}
          value={host}
          onOptionSelect={(_, d) => d.optionValue && setHost(d.optionValue as any)}
        >
          {(['Web', 'Mobile', 'Outlook', 'Teams'] as const).map(h => (
            <Option key={h} value={h}>{h}</Option>
          ))}
        </Dropdown>
        <div className={styles.info}>
          Returned by context.client.getClient(). Defaults to Web; choose Mobile/Outlook/Teams to simulate other hosts.
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.header}>Component Container Size</div>
        <Switch
          checked={customSizeEnabled}
          onChange={(_, data) => toggleCustomSize(data.checked)}
          label={customSizeEnabled ? 'Custom size' : 'Fill viewport'}
        />
        {customSizeEnabled && (
          <div className={styles.sizeRow}>
            <div className={styles.sizeField}>
              <Label size="small" htmlFor="container-width">Width (px)</Label>
              <Input
                id="container-width"
                type="number"
                min={1}
                value={containerWidth?.toString() ?? ''}
                onChange={(_, data) => setContainerWidth(parseSize(data.value))}
                placeholder="auto"
                input={{ style: { width: '100%' } }}
                style={{ width: '100%', minWidth: 0 }}
              />
            </div>
            <div className={styles.sizeField}>
              <Label size="small" htmlFor="container-height">Height (px)</Label>
              <Input
                id="container-height"
                type="number"
                min={1}
                value={containerHeight?.toString() ?? ''}
                onChange={(_, data) => setContainerHeight(parseSize(data.value))}
                placeholder="auto"
                input={{ style: { width: '100%' } }}
                style={{ width: '100%', minWidth: 0 }}
              />
            </div>
          </div>
        )}
        <div className={styles.info}>
          Sets the inner container the PCF control renders into. Leave off to fill the viewport.
        </div>
      </div>
    </div>
  );
}
