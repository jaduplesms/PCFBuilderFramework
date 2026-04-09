import {
  makeStyles, tokens, RadioGroup, Radio,
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

  const formFactorLabel = formFactor === 1 ? 'Desktop' : formFactor === 2 ? 'Tablet' : 'Phone';

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
    </div>
  );
}
