import {
  makeStyles, tokens, RadioGroup, Radio, Label, SpinButton, Divider,
} from '@fluentui/react-components';
import { useHarnessStore, type NetworkMode } from '../../store/harness-store';

const useStyles = makeStyles({
  root: {
    padding: '12px',
  },
  header: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '8px',
  },
  desc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: '4px',
  },
  customInput: {
    marginTop: '8px',
  },
});

const NETWORK_DESCRIPTIONS: Record<string, string> = {
  online: 'No throttling — instant responses',
  offline: 'context.webAPI serves from local data store (data.json). webAPI.online calls reject. client.isOffline() = true',
  slow3g: '2000ms latency on all WebAPI calls',
  fast3g: '500ms latency on all WebAPI calls',
  custom: 'Custom latency in milliseconds',
};

export function NetworkPanel() {
  const styles = useStyles();
  const networkMode = useHarnessStore(s => s.networkMode);
  const customLatencyMs = useHarnessStore(s => s.customLatencyMs);
  const setNetworkMode = useHarnessStore(s => s.setNetworkMode);
  const setCustomLatencyMs = useHarnessStore(s => s.setCustomLatencyMs);

  return (
    <div className={styles.root}>
      <div className={styles.header}>Network Conditioning</div>
      <RadioGroup
        value={networkMode}
        onChange={(_, data) => setNetworkMode(data.value as NetworkMode)}
      >
        <Radio value="online" label="Online (unrestricted)" />
        <Radio value="offline" label="Offline (disconnected)" />
        <Radio value="slow3g" label="Slow 3G (2000ms)" />
        <Radio value="fast3g" label="Fast 3G (500ms)" />
        <Radio value="custom" label="Custom" />
      </RadioGroup>
      <div className={styles.desc}>{NETWORK_DESCRIPTIONS[networkMode]}</div>

      {networkMode === 'custom' && (
        <div className={styles.customInput}>
          <Label size="small">Latency (ms)</Label>
          <SpinButton
            size="small"
            value={customLatencyMs}
            min={0}
            max={30000}
            step={100}
            onChange={(_, data) => setCustomLatencyMs(data.value ?? 1000)}
          />
        </div>
      )}

      <Divider style={{ margin: '12px 0' }} />

      <div className={styles.header}>WebAPI Routing</div>
      <div style={{ fontSize: 11, color: tokens.colorNeutralForeground3, lineHeight: '18px' }}>
        <div style={{ marginBottom: 6 }}>Mirrors Dynamics 365 behavior:</div>
        <table style={{ fontSize: 11, borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 6px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>context.webAPI</td>
              <td style={{ padding: '3px 6px' }}>Auto-routes — works online and offline (from data.json)</td>
            </tr>
            <tr style={{ backgroundColor: tokens.colorNeutralBackground3 }}>
              <td style={{ padding: '3px 6px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>webAPI.online</td>
              <td style={{ padding: '3px 6px' }}>Server only — rejects when offline</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 6px', fontFamily: 'Consolas, monospace', fontWeight: 600 }}>webAPI.offline</td>
              <td style={{ padding: '3px 6px' }}>Local store only — always instant, no latency</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
