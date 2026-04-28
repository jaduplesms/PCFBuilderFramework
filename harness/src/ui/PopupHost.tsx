import { useEffect, useState } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  closePopupEntry,
  getPopupsState,
  subscribePopups,
  type PopupEntry,
} from '../shim/popup-bus';

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 9000,
  },
  modalBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    pointerEvents: 'auto',
  },
  popup: {
    position: 'absolute',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    padding: tokens.spacingVerticalM,
    pointerEvents: 'auto',
    minWidth: '160px',
    maxWidth: '480px',
  },
  modalCenter: {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
});

/**
 * Renders any open popups created via context.factory.getPopupService().
 * Popup `content` is treated as plain text (no innerHTML to avoid XSS).
 */
export function PopupHost() {
  const styles = useStyles();
  const [state, setState] = useState(getPopupsState());

  useEffect(() => subscribePopups(() => setState(getPopupsState())), []);

  const openPopups = Object.values(state.popups).filter(p => p.open);
  if (openPopups.length === 0) return null;

  const hasModal = openPopups.some(p => p.popupType === 3);

  return (
    <div className={styles.overlay} data-popups-id={state.popupsId || undefined}>
      {hasModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => {
            // Close modals that opted into closeOnOutsideClick
            for (const p of openPopups) {
              if (p.popupType === 3 && p.closeOnOutsideClick) closePopupEntry(p.name);
            }
          }}
        />
      )}
      {openPopups.map(p => renderPopup(p, styles))}
    </div>
  );
}

function renderPopup(p: PopupEntry, styles: ReturnType<typeof useStyles>) {
  const isModal = p.popupType === 3;
  const positionStyle: React.CSSProperties = isModal
    ? {}
    : {
        top: p.position?.top,
        left: p.position?.left,
        right: p.position?.right,
        bottom: p.position?.bottom,
      };
  return (
    <div
      key={p.name}
      className={`${styles.popup} ${isModal ? styles.modalCenter : ''}`}
      style={positionStyle}
      data-popup-name={p.name}
    >
      {p.content ?? p.name}
    </div>
  );
}
