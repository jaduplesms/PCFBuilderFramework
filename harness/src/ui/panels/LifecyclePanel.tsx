import { useMemo } from 'react';
import { makeStyles, tokens, Button, Badge, Divider, MessageBar, MessageBarBody } from '@fluentui/react-components';
import { Delete24Regular, Warning24Regular } from '@fluentui/react-icons';
import { useHarnessStore, type LifecycleMethod } from '../../store/harness-store';

const METHOD_COLORS: Record<LifecycleMethod, string> = {
  init: '#0078d4',
  updateView: '#107c10',
  getOutputs: '#8764b8',
  destroy: '#d13438',
  notifyOutputChanged: '#ff8c00',
};

const METHOD_LABELS: Record<LifecycleMethod, string> = {
  init: 'init()',
  updateView: 'updateView()',
  getOutputs: 'getOutputs()',
  destroy: 'destroy()',
  notifyOutputChanged: 'notifyOutputChanged()',
};

const useStyles = makeStyles({
  root: {
    padding: '12px',
    overflowY: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
  },
  metricLabel: {
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  timelineEvent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    fontSize: '11px',
  },
  methodDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  methodLine: {
    width: '2px',
    backgroundColor: tokens.colorNeutralStroke2,
    alignSelf: 'stretch',
    marginLeft: '3px',
  },
  methodName: {
    fontFamily: "'Consolas', monospace",
    fontWeight: 600,
    fontSize: '11px',
    minWidth: '130px',
  },
  duration: {
    fontFamily: "'Consolas', monospace",
    fontSize: '10px',
    textAlign: 'right' as const,
    minWidth: '50px',
  },
  eventTime: {
    fontSize: '9px',
    color: tokens.colorNeutralForeground3,
    minWidth: '70px',
  },
  sequenceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '3px 0',
  },
  sequenceBlock: {
    height: '18px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    fontWeight: 600,
    color: 'white',
    minWidth: '14px',
    cursor: 'default',
  },
  barChart: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  barLabel: {
    fontSize: '10px',
    fontFamily: "'Consolas', monospace",
    minWidth: '120px',
    textAlign: 'right' as const,
  },
  bar: {
    height: '16px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '4px',
    fontSize: '9px',
    fontWeight: 600,
    color: 'white',
    minWidth: '2px',
  },
  emptyState: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center' as const,
    padding: '24px 8px',
  },
});

export function LifecyclePanel() {
  const styles = useStyles();
  const events = useHarnessStore(s => s.lifecycleEvents);
  const clearLifecycle = useHarnessStore(s => s.clearLifecycle);
  const resourceLeaks = useHarnessStore(s => s.resourceLeaks);

  // Method call counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { init: 0, updateView: 0, getOutputs: 0, destroy: 0, notifyOutputChanged: 0 };
    for (const e of events) c[e.method] = (c[e.method] || 0) + 1;
    return c;
  }, [events]);

  // Average durations per method
  const avgDurations = useMemo(() => {
    const sums: Record<string, { total: number; count: number }> = {};
    for (const e of events) {
      if (!sums[e.method]) sums[e.method] = { total: 0, count: 0 };
      sums[e.method].total += e.durationMs;
      sums[e.method].count++;
    }
    const result: Record<string, number> = {};
    for (const [m, s] of Object.entries(sums)) {
      result[m] = s.count > 0 ? s.total / s.count : 0;
    }
    return result;
  }, [events]);

  // Max duration for bar scaling
  const maxDuration = useMemo(() => {
    const methods: LifecycleMethod[] = ['init', 'updateView', 'getOutputs', 'destroy'];
    return Math.max(...methods.map(m => avgDurations[m] || 0), 1);
  }, [avgDurations]);

  // Last 50 events for sequence diagram
  const recentEvents = useMemo(() => events.slice(-50), [events]);

  // Total time across all lifecycle calls
  const totalMs = useMemo(() => events.reduce((s, e) => s + e.durationMs, 0), [events]);

  // Errors
  const errors = useMemo(() => events.filter(e => e.error), [events]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 0.1) return '<0.1ms';
    if (ms < 1) return `${ms.toFixed(1)}ms`;
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={styles.root}>
      {/* Header */}
      <div>
        <div className={styles.sectionHeader}>
          Lifecycle Monitor
          <span style={{ flex: 1 }} />
          <Button appearance="subtle" icon={<Delete24Regular />} size="small" onClick={clearLifecycle} title="Clear lifecycle events" />
        </div>
      </div>

      {events.length === 0 ? (
        <div className={styles.emptyState}>
          No lifecycle events yet. Load a control to start monitoring.
        </div>
      ) : (
        <>
          {/* Call Counts */}
          <div>
            <div className={styles.sectionHeader}>Call Counts</div>
            <div className={styles.grid} style={{ marginTop: 6 }}>
              {(['init', 'updateView', 'getOutputs', 'destroy', 'notifyOutputChanged'] as LifecycleMethod[]).map(m => (
                <div className={styles.metric} key={m}>
                  <div className={styles.metricValue} style={{ color: METHOD_COLORS[m] }}>
                    {counts[m] || 0}
                  </div>
                  <div className={styles.metricLabel}>{METHOD_LABELS[m]}</div>
                </div>
              ))}
              <div className={styles.metric}>
                <div className={styles.metricValue}>{formatDuration(totalMs)}</div>
                <div className={styles.metricLabel}>Total Lifecycle Time</div>
              </div>
            </div>
          </div>

          {/* Average Duration Bars */}
          <div>
            <div className={styles.sectionHeader}>Avg Duration by Method</div>
            <div className={styles.barChart} style={{ marginTop: 6 }}>
              {(['init', 'updateView', 'getOutputs', 'destroy'] as LifecycleMethod[]).filter(m => counts[m] > 0).map(m => (
                <div className={styles.barRow} key={m}>
                  <div className={styles.barLabel} style={{ color: METHOD_COLORS[m] }}>
                    {METHOD_LABELS[m]}
                  </div>
                  <div
                    className={styles.bar}
                    style={{
                      width: `${Math.max(((avgDurations[m] || 0) / maxDuration) * 100, 3)}%`,
                      backgroundColor: METHOD_COLORS[m],
                    }}
                    title={`Avg: ${formatDuration(avgDurations[m] || 0)} (${counts[m]} calls)`}
                  >
                    {(avgDurations[m] || 0) > maxDuration * 0.15 ? formatDuration(avgDurations[m] || 0) : ''}
                  </div>
                  {(avgDurations[m] || 0) <= maxDuration * 0.15 && (
                    <span style={{ fontSize: '9px', color: tokens.colorNeutralForeground3 }}>
                      {formatDuration(avgDurations[m] || 0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sequence Diagram */}
          <Divider />
          <div>
            <div className={styles.sectionHeader}>
              Event Sequence
              <Badge appearance="outline" size="small">{events.length} total</Badge>
            </div>
            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: 6 }}>
              {recentEvents.map(e => (
                <div
                  key={e.id}
                  className={styles.sequenceBlock}
                  style={{ backgroundColor: METHOD_COLORS[e.method] }}
                  title={`${METHOD_LABELS[e.method]} — ${formatDuration(e.durationMs)} at ${formatTime(e.timestamp)}${e.error ? ` — ERROR: ${e.error}` : ''}`}
                >
                  {e.method === 'init' ? 'I' :
                   e.method === 'updateView' ? 'U' :
                   e.method === 'getOutputs' ? 'O' :
                   e.method === 'destroy' ? 'D' :
                   'N'}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: 6, fontSize: '9px', color: tokens.colorNeutralForeground3 }}>
              {(['init', 'updateView', 'getOutputs', 'destroy', 'notifyOutputChanged'] as LifecycleMethod[]).filter(m => counts[m] > 0).map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: METHOD_COLORS[m] }} />
                  {m === 'notifyOutputChanged' ? 'notify' : m}
                </div>
              ))}
            </div>
          </div>

          {/* Event Log */}
          <Divider />
          <div>
            <div className={styles.sectionHeader}>Recent Events</div>
            <div className={styles.timeline} style={{ marginTop: 4 }}>
              {recentEvents.slice(-20).reverse().map(e => (
                <div key={e.id} className={styles.timelineEvent}>
                  <div className={styles.methodDot} style={{ backgroundColor: METHOD_COLORS[e.method] }} />
                  <div className={styles.eventTime}>{formatTime(e.timestamp)}</div>
                  <div className={styles.methodName} style={{ color: METHOD_COLORS[e.method] }}>
                    {METHOD_LABELS[e.method]}
                  </div>
                  <div className={styles.duration} style={{
                    color: e.durationMs > 16 ? '#ff8c00' : e.durationMs > 100 ? '#d13438' : tokens.colorNeutralForeground3,
                  }}>
                    {formatDuration(e.durationMs)}
                  </div>
                  {e.error && <Badge color="danger" size="small">error</Badge>}
                </div>
              ))}
            </div>
          </div>

          {/* Resource Leaks */}
          {resourceLeaks.length > 0 && (
            <>
              <Divider />
              <div>
                <div className={styles.sectionHeader}>
                  <Warning24Regular style={{ color: '#d13438' }} />
                  Resource Leaks
                  <Badge color="danger" size="small">{resourceLeaks.length}</Badge>
                </div>
                <MessageBar intent="warning" style={{ marginTop: 6 }}>
                  <MessageBarBody>
                    {resourceLeaks.length} resource(s) created but not cleaned up in destroy(). This can cause memory leaks and unexpected behavior.
                  </MessageBarBody>
                </MessageBar>
                <div style={{ marginTop: 8 }}>
                  {resourceLeaks.map((leak, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 8px', fontSize: '11px',
                      borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
                      backgroundColor: 'rgba(209,52,56,0.05)',
                    }}>
                      <Badge
                        appearance="filled"
                        color={leak.type === 'eventListener' ? 'important' : leak.type === 'timer' ? 'warning' : 'severe'}
                        size="small"
                      >
                        {leak.type === 'eventListener' ? 'event' : leak.type}
                      </Badge>
                      <span style={{ fontFamily: "'Consolas', monospace", fontSize: '10px' }}>
                        {leak.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Lifecycle Health Checks */}
          <Divider />
          <div>
            <div className={styles.sectionHeader}>Health Checks</div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* init without destroy */}
              <HealthCheck
                pass={counts.init === 0 || counts.destroy >= counts.init - 1}
                label="init/destroy balanced"
                detail={counts.init > 0 && counts.destroy < counts.init - 1
                  ? `${counts.init} init() but only ${counts.destroy} destroy() — missing cleanup`
                  : `${counts.init} init, ${counts.destroy} destroy`}
              />
              {/* updateView called after init */}
              <HealthCheck
                pass={counts.init === 0 || counts.updateView > 0}
                label="updateView called after init"
                detail={counts.init > 0 && counts.updateView === 0
                  ? 'init() was called but updateView() was never invoked'
                  : `${counts.updateView} updateView calls`}
              />
              {/* No resource leaks */}
              <HealthCheck
                pass={resourceLeaks.length === 0}
                label="No resource leaks"
                detail={resourceLeaks.length > 0
                  ? `${resourceLeaks.length} leaked: ${resourceLeaks.map(l => l.type).join(', ')}`
                  : 'All resources cleaned up'}
              />
              {/* Render performance */}
              <HealthCheck
                pass={avgDurations.updateView === undefined || (avgDurations.updateView || 0) < 16}
                label="updateView under 16ms budget"
                detail={avgDurations.updateView !== undefined
                  ? `Avg: ${formatDuration(avgDurations.updateView || 0)}`
                  : 'No renders yet'}
              />
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <>
              <Divider />
              <div>
                <div className={styles.sectionHeader}>
                  Errors <Badge color="danger" size="small">{errors.length}</Badge>
                </div>
                {errors.slice(-5).map(e => (
                  <div key={e.id} style={{ fontSize: '10px', color: '#d13438', padding: '4px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
                    <strong>{METHOD_LABELS[e.method]}</strong> at {formatTime(e.timestamp)}: {e.error}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function HealthCheck({ pass, label, detail }: { pass: boolean; label: string; detail: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '5px 8px', fontSize: '11px',
      backgroundColor: pass ? 'rgba(16,124,16,0.05)' : 'rgba(209,52,56,0.08)',
      borderRadius: '4px',
    }}>
      <span style={{ fontSize: '14px' }}>{pass ? '\u2705' : '\u274C'}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: '10px', color: pass ? '#107c10' : '#d13438' }}>{detail}</span>
    </div>
  );
}
