import type { HarnessStore } from '../store/harness-store';

export function createModeShim(getState: () => HarnessStore) {
  return {
    get allocatedHeight() { return getState().viewportHeight; },
    get allocatedWidth() { return getState().viewportWidth; },
    get isControlDisabled() { return getState().isControlDisabled; },
    get isVisible() { return true; },
    label: '',
    get contextInfo() {
      const s = getState();
      return {
        entityId: s.pageEntityId,
        entityTypeName: s.pageEntityTypeName,
        entityRecordName: s.pageEntityRecordName,
      };
    },
    setControlState(_state: Record<string, any>): boolean {
      getState().addLogEntry({ category: 'mode', method: 'setControlState', args: _state });
      return true;
    },
    setFullScreen(value: boolean): void {
      const s = getState();
      s.addLogEntry({ category: 'mode', method: 'setFullScreen', args: value });
      s.setFullscreen(value);
    },
    trackContainerResize(value: boolean): void {
      getState().addLogEntry({ category: 'mode', method: 'trackContainerResize', args: value });
    },
  };
}
