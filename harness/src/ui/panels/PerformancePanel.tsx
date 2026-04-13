import { useMemo } from 'react';
import { makeStyles, tokens, Button, Divider, Badge } from '@fluentui/react-components';
import { Delete24Regular } from '@fluentui/react-icons';
import { useHarnessStore, type WebApiCallRecord, type HeapSnapshot } from '../../store/harness-store';

const useStyles = makeStyles({
  root: {
    padding: '12px',
    overflowY: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
  metric: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: '8px 10px',
  },
  metricValue: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  metricLabel: {
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
  },
  warning: { color: '#ff8c00' },
  error: { color: '#d13438' },
  good: { color: '#107c10' },
  table: {
    width: '100%',
    fontSize: '11px',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '4px 6px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
  },
  td: {
    padding: '4px 6px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontFamily: "'Consolas', monospace",
    fontSize: '10px',
  },
  barContainer: {
    display: 'flex',
    gap: '1px',
    height: '32px',
    alignItems: 'flex-end',
  },
  bar: {
    flex: 1,
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: '2px 2px 0 0',
    minWidth: '3px',
  },
  heapTimeline: {
    display: 'flex',
    gap: '1px',
    height: '40px',
    alignItems: 'flex-end',
    padding: '4px 0',
  },
  heapBar: {
    flex: 1,
    borderRadius: '1px 1px 0 0',
    minWidth: '2px',
  },
  emptyState: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center' as const,
    padding: '8px',
  },
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function PerformancePanel() {
  const styles = useStyles();
  const renderCount = useHarnessStore(s => s.renderCount);
  const lastRenderTimeMs = useHarnessStore(s => s.lastRenderTimeMs);
  const renderTimings = useHarnessStore(s => s.renderTimings);
  const webApiCallCount = useHarnessStore(s => s.webApiCallCount);
  const domNodeCount = useHarnessStore(s => s.domNodeCount);
  const jsHeapUsedMB = useHarnessStore(s => s.jsHeapUsedMB);
  const webApiCalls = useHarnessStore(s => s.webApiCalls);
  const heapSnapshots = useHarnessStore(s => s.heapSnapshots);
  const resetMetrics = useHarnessStore(s => s.resetMetrics);

  // Top requests by duration
  const topByDuration = useMemo(() =>
    [...webApiCalls].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5),
    [webApiCalls],
  );

  // Top requests by response size
  const topBySize = useMemo(() =>
    [...webApiCalls].sort((a, b) => b.responseSize - a.responseSize).slice(0, 5),
    [webApiCalls],
  );

  // Failed requests
  const failedCalls = useMemo(() =>
    webApiCalls.filter(c => c.error),
    [webApiCalls],
  );

  // Heap analysis: top 3 growth points
  const heapGrowth = useMemo(() => {
    if (heapSnapshots.length < 2) return [];
    const deltas: Array<{ label: string; deltaMB: number; heapMB: number }> = [];
    for (let i = 1; i < heapSnapshots.length; i++) {
      const delta = heapSnapshots[i].heapUsedMB - heapSnapshots[i - 1].heapUsedMB;
      deltas.push({
        label: heapSnapshots[i].label,
        deltaMB: delta,
        heapMB: heapSnapshots[i].heapUsedMB,
      });
    }
    return deltas.sort((a, b) => b.deltaMB - a.deltaMB).slice(0, 3);
  }, [heapSnapshots]);

  // Render timing sparkline
  const maxRenderTime = Math.max(...renderTimings, 1);
  const avgRenderTime = renderTimings.length > 0
    ? renderTimings.reduce((a, b) => a + b, 0) / renderTimings.length : 0;

  // Heap timeline
  const maxHeap = heapSnapshots.length > 0 ? Math.max(...heapSnapshots.map(s => s.heapUsedMB), 1) : 1;
  const heapAvailable = jsHeapUsedMB > 0;

  const renderTimeColor = lastRenderTimeMs > 16 ? styles.warning : styles.good;

  return (
    <div className={styles.root}>
      {/* Summary Metrics */}
      <div>
        <div className={styles.sectionHeader}>
          Overview
          <span style={{ flex: 1 }} />
          <Button appearance="subtle" icon={<Delete24Regular />} size="small" onClick={resetMetrics} title="Reset metrics" />
        </div>
        <div className={styles.grid} style={{ marginTop: 6 }}>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{renderCount}</div>
            <div className={styles.metricLabel}>Renders</div>
          </div>
          <div className={styles.metric}>
            <div className={`${styles.metricValue} ${renderTimeColor}`}>
              {lastRenderTimeMs.toFixed(1)}ms
            </div>
            <div className={styles.metricLabel}>Last Render {avgRenderTime > 0 && `(avg ${avgRenderTime.toFixed(1)}ms)`}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{domNodeCount}</div>
            <div className={styles.metricLabel}>DOM Nodes</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricValue}>{webApiCallCount}</div>
            <div className={styles.metricLabel}>WebAPI Calls {failedCalls.length > 0 && <Badge color="danger" size="small">{failedCalls.length} failed</Badge>}</div>
          </div>
        </div>
      </div>

      {/* Render Timing Sparkline */}
      {renderTimings.length > 1 && (
        <div>
          <div className={styles.sectionHeader}>Render Timeline</div>
          <div className={styles.barContainer}>
            {renderTimings.map((t, i) => (
              <div
                key={i}
                className={styles.bar}
                style={{
                  height: `${Math.max((t / maxRenderTime) * 100, 3)}%`,
                  backgroundColor: t > 16 ? '#ff8c00' : '#0078d4',
                }}
                title={`#${i + 1}: ${t.toFixed(1)}ms`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#999', marginTop: 2 }}>
            <span>0ms</span>
            <span style={{ borderTop: '1px dashed #ff8c00', paddingTop: 1, fontSize: 8 }}>16ms budget</span>
            <span>{maxRenderTime.toFixed(0)}ms</span>
          </div>
        </div>
      )}

      {/* Top Requests by Duration */}
      {topByDuration.length > 0 && (
        <div>
          <div className={styles.sectionHeader}>Slowest Requests</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Method</th>
                <th className={styles.th}>Entity</th>
                <th className={styles.th}>Duration</th>
                <th className={styles.th}>Records</th>
              </tr>
            </thead>
            <tbody>
              {topByDuration.map((c, i) => (
                <tr key={i}>
                  <td className={styles.td} style={{ fontSize: 9 }}>{c.method.replace('Records', '')}</td>
                  <td className={styles.td}>{c.entityType}</td>
                  <td className={styles.td} style={{ color: c.durationMs > 1000 ? '#d13438' : c.durationMs > 100 ? '#ff8c00' : '#107c10' }}>
                    {formatDuration(c.durationMs)}
                  </td>
                  <td className={styles.td}>{c.recordCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Requests by Size */}
      {topBySize.length > 0 && (
        <div>
          <div className={styles.sectionHeader}>Largest Responses</div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Method</th>
                <th className={styles.th}>Entity</th>
                <th className={styles.th}>Size</th>
                <th className={styles.th}>Records</th>
              </tr>
            </thead>
            <tbody>
              {topBySize.map((c, i) => (
                <tr key={i}>
                  <td className={styles.td} style={{ fontSize: 9 }}>{c.method.replace('Records', '')}</td>
                  <td className={styles.td}>{c.entityType}</td>
                  <td className={styles.td} style={{ color: c.responseSize > 100000 ? '#d13438' : c.responseSize > 10000 ? '#ff8c00' : '#107c10' }}>
                    {formatBytes(c.responseSize)}
                  </td>
                  <td className={styles.td}>{c.recordCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Failed Requests */}
      {failedCalls.length > 0 && (
        <div>
          <div className={styles.sectionHeader}>
            Failed Requests
            <Badge color="danger" size="small">{failedCalls.length}</Badge>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Method</th>
                <th className={styles.th}>Entity</th>
                <th className={styles.th}>Error</th>
              </tr>
            </thead>
            <tbody>
              {failedCalls.slice(-5).map((c, i) => (
                <tr key={i}>
                  <td className={styles.td}>{c.method.replace('Records', '')}</td>
                  <td className={styles.td}>{c.entityType}</td>
                  <td className={styles.td} style={{ color: '#d13438', wordBreak: 'break-all' }}>{c.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {webApiCallCount === 0 && (
        <div className={styles.emptyState}>
          No WebAPI calls yet. Interact with the control to see performance data.
        </div>
      )}
    </div>
  );
}
