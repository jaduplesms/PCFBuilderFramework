import { useRef, useEffect, useState, useMemo } from 'react';
import { makeStyles, tokens, Button, Badge } from '@fluentui/react-components';
import { Delete24Regular } from '@fluentui/react-icons';
import { useHarnessStore } from '../../store/harness-store';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  title: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap' as const,
  },
  logContainer: {
    flex: 1,
    overflowY: 'auto',
    fontFamily: "'Consolas', 'Courier New', monospace",
    fontSize: '11px',
    lineHeight: '18px',
    padding: '4px 0',
  },
  entry: {
    padding: '2px 12px',
    borderBottom: '1px solid #f0f0f0',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  timestamp: {
    color: '#999',
    marginRight: '8px',
  },
  category: {
    fontWeight: 'bold',
    marginRight: '4px',
  },
  method: {
    color: tokens.colorBrandForeground1,
  },
  args: {
    color: '#666',
    marginLeft: '8px',
  },
  result: {
    color: '#107c10',
    marginLeft: '8px',
  },
});

const CATEGORY_COLORS: Record<string, string> = {
  lifecycle: '#0078d4',
  webAPI: '#ff8c00',
  navigation: '#881c98',
  device: '#d13438',
  mode: '#107c10',
  utils: '#666',
  factory: '#999',
  data: '#107c10',
  scenario: '#881c98',
};

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

export function ConsolePanel() {
  const styles = useStyles();
  const logRef = useRef<HTMLDivElement>(null);
  const logEntries = useHarnessStore(s => s.logEntries);
  const clearLog = useHarnessStore(s => s.clearLog);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setHiddenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredEntries = useMemo(
    () => hiddenCategories.size === 0
      ? logEntries
      : logEntries.filter(e => !hiddenCategories.has(e.category)),
    [logEntries, hiddenCategories],
  );

  // Auto-scroll to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries.length]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const formatArgs = (args: any): string => {
    if (args === undefined) return '';
    try {
      return JSON.stringify(args, null, 0);
    } catch {
      return String(args);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>Console ({filteredEntries.length})</span>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {ALL_CATEGORIES.map(cat => (
            <Badge
              key={cat}
              appearance={hiddenCategories.has(cat) ? 'outline' : 'filled'}
              size="small"
              color="informative"
              style={{
                cursor: 'pointer',
                opacity: hiddenCategories.has(cat) ? 0.4 : 1,
                fontSize: 9,
              }}
              onClick={() => toggleCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
        <Button
          appearance="subtle"
          icon={<Delete24Regular />}
          size="small"
          onClick={clearLog}
          title="Clear log"
        />
      </div>
      <div ref={logRef} className={styles.logContainer}>
        {filteredEntries.map(entry => (
          <div key={entry.id} className={styles.entry}>
            <span className={styles.timestamp}>{formatTime(entry.timestamp)}</span>
            <span
              className={styles.category}
              style={{ color: CATEGORY_COLORS[entry.category] ?? '#666' }}
            >
              [{entry.category}]
            </span>
            <span className={styles.method}>{entry.method}</span>
            {entry.args !== undefined && (
              <span className={styles.args}>{formatArgs(entry.args)}</span>
            )}
            {entry.result !== undefined && (
              <span className={styles.result}> → {formatArgs(entry.result)}</span>
            )}
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <div style={{ padding: '12px', color: '#999', textAlign: 'center' }}>
            No events yet. Load a control to see lifecycle events.
          </div>
        )}
      </div>
    </div>
  );
}
