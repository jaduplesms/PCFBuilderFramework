import { useState, useCallback } from 'react';
import {
  makeStyles, tokens, Button, Badge, Textarea, MessageBar, MessageBarBody,
} from '@fluentui/react-components';
import { ArrowClockwise24Regular, Save24Regular } from '@fluentui/react-icons';
import { useHarnessStore } from '../../store/harness-store';
import { loadEntityData, getEntityData } from '../../store/data-store';

const useStyles = makeStyles({
  root: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '8px',
  },
  header: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  tableList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tableItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase200,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  tableItemActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: 'white',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground,
    },
  },
  tableName: {
    flex: 1,
    fontFamily: "'Consolas', monospace",
  },
  editorArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minHeight: 0,
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: tokens.fontSizeBase200,
  },
  textarea: {
    flex: 1,
    fontFamily: "'Consolas', monospace",
    fontSize: '11px',
  },
  actions: {
    display: 'flex',
    gap: '4px',
  },
  info: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

interface DataSummary {
  tables: { name: string; count: number }[];
  totalRecords: number;
}

function getDataSummary(): DataSummary {
  // We need to inspect what's loaded — scan common table names
  // Since the data store doesn't expose all keys, we'll track them via a reload
  return { tables: [], totalRecords: 0 };
}

export function DataPanel() {
  const styles = useStyles();
  const addLogEntry = useHarnessStore(s => s.addLogEntry);
  const [tables, setTables] = useState<{ name: string; records: any[] }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editJson, setEditJson] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(() => {
    fetch('/pcf-data/data.json')
      .then(r => r.json())
      .then((data: Record<string, any[]>) => {
        if (data && typeof data === 'object') {
          loadEntityData(data);
          const tableList = Object.entries(data).map(([name, records]) => ({
            name,
            records: Array.isArray(records) ? records : [],
          }));
          setTables(tableList);
          setLoaded(true);
          addLogEntry({ category: 'data', method: 'reload', args: { tables: tableList.length, records: tableList.reduce((s, t) => s + t.records.length, 0) } });
        }
      })
      .catch(() => {
        setTables([]);
        setLoaded(true);
      });
  }, [addLogEntry]);

  // Load on first render
  if (!loaded) {
    loadData();
  }

  const handleSelectTable = useCallback((name: string) => {
    setSelectedTable(name);
    const table = tables.find(t => t.name === name);
    if (table) {
      setEditJson(JSON.stringify(table.records, null, 2));
      setEditError(null);
    }
  }, [tables]);

  const handleSaveTable = useCallback(() => {
    if (!selectedTable) return;
    try {
      const parsed = JSON.parse(editJson);
      if (!Array.isArray(parsed)) {
        setEditError('Data must be a JSON array of records');
        return;
      }
      // Update in-memory store
      const allData: Record<string, any[]> = {};
      for (const t of tables) {
        allData[t.name] = t.name === selectedTable ? parsed : t.records;
      }
      loadEntityData(allData);
      setTables(tables.map(t => t.name === selectedTable ? { ...t, records: parsed } : t));
      setEditError(null);
      addLogEntry({ category: 'data', method: 'updateTable', args: { table: selectedTable, records: parsed.length } });
    } catch (err: any) {
      setEditError(`Invalid JSON: ${err.message}`);
    }
  }, [selectedTable, editJson, tables, addLogEntry]);

  return (
    <div className={styles.root}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={styles.header}>Mock Data</span>
        <Button
          appearance="subtle"
          icon={<ArrowClockwise24Regular />}
          size="small"
          onClick={loadData}
          title="Reload data.json"
        />
      </div>

      {tables.length === 0 && loaded && (
        <div className={styles.info}>
          No data.json found. Create one in the control directory:
          <pre style={{ fontSize: 10, marginTop: 4, whiteSpace: 'pre-wrap' }}>
{`{
  "tableName": [
    { "id": "...", "name": "..." }
  ]
}`}
          </pre>
        </div>
      )}

      <div className={styles.tableList}>
        {tables.map(t => (
          <div
            key={t.name}
            className={`${styles.tableItem} ${selectedTable === t.name ? styles.tableItemActive : ''}`}
            onClick={() => handleSelectTable(t.name)}
          >
            <span className={styles.tableName}>{t.name}</span>
            <Badge appearance="filled" color={selectedTable === t.name ? 'subtle' : 'informative'} size="small">
              {t.records.length}
            </Badge>
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className={styles.editorArea}>
          <div className={styles.editorHeader}>
            <span style={{ fontWeight: 600 }}>{selectedTable}</span>
            <span className={styles.info}>({tables.find(t => t.name === selectedTable)?.records.length} records)</span>
            <span style={{ flex: 1 }} />
            <Button
              appearance="primary"
              icon={<Save24Regular />}
              size="small"
              onClick={handleSaveTable}
            >
              Apply
            </Button>
          </div>
          {editError && (
            <MessageBar intent="error">
              <MessageBarBody>{editError}</MessageBarBody>
            </MessageBar>
          )}
          <Textarea
            className={styles.textarea}
            value={editJson}
            onChange={(_, d) => setEditJson(d.value)}
            resize="none"
            style={{ minHeight: 150, flex: 1 }}
          />
        </div>
      )}
    </div>
  );
}
