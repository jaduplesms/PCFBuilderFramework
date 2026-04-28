import { useEffect, useState } from 'react';
import { makeStyles, tokens, MessageBar, MessageBarBody, MessageBarTitle, MessageBarActions, Button } from '@fluentui/react-components';
import { Dismiss20Regular } from '@fluentui/react-icons';
import {
    subscribeFormNotifications,
    dismissFormNotification,
    type FormNotification,
} from '../shim/xrm-form';

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px 12px 0 12px',
        flexShrink: 0,
    },
    bar: {
        boxShadow: tokens.shadow2,
    },
    title: {
        fontWeight: tokens.fontWeightSemibold,
    },
});

const LEVEL_INTENT = {
    ERROR: 'error',
    WARNING: 'warning',
    INFORMATION: 'info',
} as const;

const LEVEL_LABEL = {
    ERROR: 'Error',
    WARNING: 'Warning',
    INFORMATION: 'Info',
} as const;

/**
 * Renders the simulated form-notification banner above the PCF viewport.
 * Mirrors the model-driven host UX so PCFs using
 * `Xrm.Page.ui.setFormNotification` can be tested without the real platform.
 */
export function FormNotificationBanner(): JSX.Element | null {
    const styles = useStyles();
    const [items, setItems] = useState<readonly FormNotification[]>([]);

    useEffect(() => subscribeFormNotifications(setItems), []);

    if (items.length === 0) return null;

    return (
        <div className={styles.root} role="region" aria-label="Form notifications">
            {items.map((n) => (
                <MessageBar
                    key={n.id}
                    intent={LEVEL_INTENT[n.level]}
                    className={styles.bar}
                    layout="multiline"
                >
                    <MessageBarBody>
                        <MessageBarTitle>{LEVEL_LABEL[n.level]}</MessageBarTitle>
                        {' '}
                        {n.message}
                    </MessageBarBody>
                    <MessageBarActions
                        containerAction={
                            <Button
                                aria-label="Dismiss"
                                appearance="transparent"
                                icon={<Dismiss20Regular />}
                                onClick={() => dismissFormNotification(n.id)}
                            />
                        }
                    />
                </MessageBar>
            ))}
        </div>
    );
}
