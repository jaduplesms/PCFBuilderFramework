import { useEffect, useState } from 'react';
import {
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
  Button, Input, Label, Field, Textarea, Dropdown, Option,
  Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Checkbox,
} from '@fluentui/react-components';
import { subscribeDialogs, resolveDialog, type DialogRequest, type OpenFormDialogRequest, type LookupDialogRequest } from '../shim/dialog-bus';
import { getEntityData, getEntityStoreKeys } from '../store/data-store';

/**
 * Mounts above the harness UI and renders queued dialog requests from
 * shims (navigation.openForm, utils.lookupObjects, etc.) so makers can
 * compose the response the control will receive.
 */
export function DialogHost() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);

  useEffect(() => subscribeDialogs(setQueue), []);

  const current = queue[0];
  if (!current) return null;

  if (current.kind === 'openForm') return <OpenFormDialog request={current} />;
  if (current.kind === 'lookup') return <LookupDialog request={current} />;
  return null;
}

function OpenFormDialog({ request }: { request: OpenFormDialogRequest }) {
  const [entityType, setEntityType] = useState<string>(request.options?.entityName ?? '');
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [skip, setSkip] = useState(false);

  const submit = () => {
    if (skip || !entityType || !id) {
      resolveDialog(request.id, { savedEntityReference: [] });
    } else {
      resolveDialog(request.id, {
        savedEntityReference: [{ entityType, id, name }],
      });
    }
  };

  return (
    <Dialog open modalType="alert">
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Simulate openForm response</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Control invoked context.navigation.openForm. Compose the
              savedEntityReference the control will receive when the form closes.
            </div>
            <Field label="Options (read-only)">
              <Textarea readOnly rows={4} value={JSON.stringify({ options: request.options, parameters: request.parameters }, null, 2)} />
            </Field>
            <Field label="Entity type">
              <Input value={entityType} onChange={(_, d) => setEntityType(d.value)} placeholder="account" />
            </Field>
            <Field label="Record id">
              <Input value={id} onChange={(_, d) => setId(d.value)} placeholder="GUID" />
            </Field>
            <Field label="Record name">
              <Input value={name} onChange={(_, d) => setName(d.value)} placeholder="Display name" />
            </Field>
            <Checkbox checked={skip} onChange={(_, d) => setSkip(!!d.checked)} label="Resolve with empty savedEntityReference (form was cancelled)" />
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={submit}>Resolve</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

function LookupDialog({ request }: { request: LookupDialogRequest }) {
  const allowedTypes: string[] = Array.isArray(request.options?.entityTypes) && request.options.entityTypes.length > 0
    ? request.options.entityTypes
    : getEntityStoreKeys();
  const allowMultiSelect = !!request.options?.allowMultiSelect;

  const [entityType, setEntityType] = useState<string>(allowedTypes[0] ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const records = entityType ? getEntityData(entityType) : [];
  const idField = records[0] ? Object.keys(records[0]).find(k => k.toLowerCase().endsWith('id')) ?? Object.keys(records[0])[0] : '';
  const nameField = records[0] ? Object.keys(records[0]).find(k => k.toLowerCase().includes('name')) ?? idField : '';

  const toggle = (recordId: string) => {
    const next = new Set(allowMultiSelect ? selected : []);
    if (next.has(recordId)) next.delete(recordId);
    else next.add(recordId);
    setSelected(next);
  };

  const submit = () => {
    const out = records
      .filter(r => selected.has(String(r[idField])))
      .map(r => ({
        id: String(r[idField]),
        name: String(r[nameField] ?? r[idField] ?? ''),
        entityType,
      }));
    resolveDialog(request.id, out);
  };

  return (
    <Dialog open modalType="alert">
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Lookup records</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 480 }}>
            {allowedTypes.length > 1 && (
              <Field label="Entity type">
                <Dropdown
                  selectedOptions={[entityType]}
                  value={entityType}
                  onOptionSelect={(_, d) => { setEntityType(d.optionValue ?? ''); setSelected(new Set()); }}
                >
                  {allowedTypes.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Dropdown>
              </Field>
            )}
            <Label size="small">{records.length} records · select {allowMultiSelect ? 'one or more' : 'one'}</Label>
            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #ccc', borderRadius: 4 }}>
              <Table size="small">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell />
                    <TableHeaderCell>{nameField}</TableHeaderCell>
                    <TableHeaderCell>{idField}</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => {
                    const rid = String(r[idField]);
                    return (
                      <TableRow key={rid}>
                        <TableCell>
                          <Checkbox checked={selected.has(rid)} onChange={() => toggle(rid)} />
                        </TableCell>
                        <TableCell>{String(r[nameField] ?? '')}</TableCell>
                        <TableCell style={{ fontFamily: 'monospace', fontSize: 11 }}>{rid}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => resolveDialog(request.id, [])}>Cancel</Button>
            <Button appearance="primary" onClick={submit}>Select</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
