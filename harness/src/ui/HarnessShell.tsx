import { useState } from 'react';
import {
  makeStyles, tokens, Tab, TabList, Switch, Label, Button, Divider,
} from '@fluentui/react-components';
import {
  PlugConnected24Regular, Phone24Regular, TopSpeed24Regular,
  Settings24Regular, WeatherMoon24Regular, WeatherSunny24Regular,
  Database24Regular, Beaker24Regular, Play24Regular,
} from '@fluentui/react-icons';
import { useHarnessStore, DEVICE_PRESETS } from '../store/harness-store';
import { ControlViewport } from './panels/ControlViewport';
import { PropertyEditor } from './panels/PropertyEditor';
import { ConsolePanel } from './panels/ConsolePanel';
import { NetworkPanel } from './panels/NetworkPanel';
import { DevicePanel } from './panels/DevicePanel';
import { PerformancePanel } from './panels/PerformancePanel';
import { DataPanel } from './panels/DataPanel';
import { ScenariosPanel } from './panels/ScenariosPanel';
import { LifecyclePanel } from './panels/LifecyclePanel';
import type { ManifestConfig } from '../types/manifest';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    height: '44px',
    backgroundColor: '#0078d4',
    color: 'white',
    flexShrink: 0,
    gap: '12px',
  },
  logo: {
    fontWeight: 600,
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
  topBarSpacer: {
    flex: 1,
  },
  topBarControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  mainPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  viewportArea: {
    flex: 1,
    overflow: 'hidden',
  },
  consoleArea: {
    height: '220px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
    overflow: 'hidden',
  },
  sidePanel: {
    width: '360px',
    borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  sidePanelTabs: {
    flexShrink: 0,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    overflowX: 'auto',
  },
  sidePanelContent: {
    flex: 1,
    overflowY: 'auto',
  },
  modeControls: {
    padding: '12px',
  },
  modeHeader: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '8px',
  },
});

interface Props {
  manifest: ManifestConfig;
  bundlePath: string;
  cssFiles: string[];
  controlDir: string;
}

type SidePanelTab = 'properties' | 'data' | 'scenarios' | 'network' | 'device' | 'lifecycle' | 'performance';

export function HarnessShell({ manifest, bundlePath, cssFiles, controlDir }: Props) {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<SidePanelTab>('properties');
  const isDarkMode = useHarnessStore(s => s.isDarkMode);
  const toggleDarkMode = useHarnessStore(s => s.toggleDarkMode);
  const isControlDisabled = useHarnessStore(s => s.isControlDisabled);
  const setControlDisabled = useHarnessStore(s => s.setControlDisabled);
  const networkMode = useHarnessStore(s => s.networkMode);

  const devicePreset = useHarnessStore(s => s.devicePreset);
  const renderCount = useHarnessStore(s => s.renderCount);
  const lastRenderTimeMs = useHarnessStore(s => s.lastRenderTimeMs);

  const deviceLabel = DEVICE_PRESETS[devicePreset]?.name ?? 'Desktop';

  const networkBadge = networkMode === 'offline'
    ? { label: 'OFFLINE', color: '#ff6b6b', bg: 'rgba(255,107,107,0.2)' }
    : networkMode === 'slow3g'
    ? { label: 'SLOW 3G', color: '#ffd93d', bg: 'rgba(255,217,61,0.2)' }
    : networkMode === 'fast3g'
    ? { label: 'FAST 3G', color: '#ffd93d', bg: 'rgba(255,217,61,0.2)' }
    : networkMode === 'custom'
    ? { label: 'THROTTLED', color: '#ffd93d', bg: 'rgba(255,217,61,0.2)' }
    : null;

  return (
    <div className={styles.root}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Button
          appearance="subtle"
          size="small"
          onClick={() => {
            fetch('/api/switch-control', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ controlDir: '' }),
            }).catch(() => {});
          }}
          style={{ color: 'white', fontWeight: 600, fontSize: 14, minWidth: 0, padding: '2px 8px' }}
          title="Back to Gallery"
        >
          &larr; Gallery
        </Button>
        <span style={{ opacity: 0.7, fontSize: 12 }}>
          {manifest.namespace}.{manifest.constructor}
        </span>

        {/* Status badges */}
        {networkBadge && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            padding: '2px 8px', borderRadius: 10,
            color: networkBadge.color, backgroundColor: networkBadge.bg,
          }}>
            {networkBadge.label}
          </span>
        )}
        <span style={{ fontSize: 11, opacity: 0.6 }}>
          {deviceLabel}
        </span>
        <span style={{ fontSize: 11, opacity: 0.6 }}>
          {renderCount > 0 && `${lastRenderTimeMs.toFixed(1)}ms`}
        </span>

        <span className={styles.topBarSpacer} />
        <div className={styles.topBarControl}>
          <Label size="small" style={{ color: 'white' }}>Disabled</Label>
          <Switch
            checked={isControlDisabled}
            onChange={(_, d) => setControlDisabled(d.checked)}
            style={{ '--colorCompoundBrandBackground': 'white' } as any}
          />
        </div>
        <Button
          appearance="subtle"
          icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
          onClick={toggleDarkMode}
          style={{ color: 'white' }}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        />
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Main panel: viewport + console */}
        <div className={styles.mainPanel}>
          <div className={styles.viewportArea}>
            <ControlViewport manifest={manifest} bundlePath={bundlePath} cssFiles={cssFiles} controlDir={controlDir} />
          </div>
          <div className={styles.consoleArea}>
            <ConsolePanel />
          </div>
        </div>

        {/* Side panel: tabs */}
        <div className={styles.sidePanel}>
          <div className={styles.sidePanelTabs}>
            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, d) => setActiveTab(d.value as SidePanelTab)}
              size="small"
            >
              <Tab value="properties" icon={<Settings24Regular />} />
              <Tab value="data" icon={<Database24Regular />} />
              <Tab value="scenarios" icon={<Beaker24Regular />} />
              <Tab value="network" icon={<PlugConnected24Regular />} />
              <Tab value="device" icon={<Phone24Regular />} />
              <Tab value="lifecycle" icon={<Play24Regular />} />
              <Tab value="performance" icon={<TopSpeed24Regular />} />
            </TabList>
          </div>
          <div className={styles.sidePanelContent}>
            {activeTab === 'properties' && <PropertyEditor manifest={manifest} />}
            {activeTab === 'data' && <DataPanel />}
            {activeTab === 'scenarios' && <ScenariosPanel controlId={`${manifest.namespace}.${manifest.constructor}`} />}
            {activeTab === 'network' && <NetworkPanel />}
            {activeTab === 'device' && <DevicePanel />}
            {activeTab === 'lifecycle' && <LifecyclePanel />}
            {activeTab === 'performance' && <PerformancePanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
