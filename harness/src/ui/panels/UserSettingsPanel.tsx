import {
  makeStyles, tokens, Dropdown, Option, Input, Switch, Label, Textarea,
} from '@fluentui/react-components';
import { useHarnessStore } from '../../store/harness-store';
import { SUPPORTED_LCIDS } from '../../shim/user-settings';

const useStyles = makeStyles({
  root: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  header: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

const RTL_LCIDS = new Set([1025, 1037]); // ar-SA, he-IL

export function UserSettingsPanel() {
  const styles = useStyles();
  const userLanguageId = useHarnessStore(s => s.userLanguageId);
  const userIsRTL = useHarnessStore(s => s.userIsRTL);
  const userTimeZoneOffsetMinutes = useHarnessStore(s => s.userTimeZoneOffsetMinutes);
  const userId = useHarnessStore(s => s.userId);
  const userName = useHarnessStore(s => s.userName);
  const userSecurityRoles = useHarnessStore(s => s.userSecurityRoles);
  const setUserLanguageId = useHarnessStore(s => s.setUserLanguageId);
  const setUserIsRTL = useHarnessStore(s => s.setUserIsRTL);
  const setUserTimeZoneOffsetMinutes = useHarnessStore(s => s.setUserTimeZoneOffsetMinutes);
  const setUserId = useHarnessStore(s => s.setUserId);
  const setUserName = useHarnessStore(s => s.setUserName);
  const setUserSecurityRoles = useHarnessStore(s => s.setUserSecurityRoles);

  const onLanguageChange = (lcid: number) => {
    setUserLanguageId(lcid);
    setUserIsRTL(RTL_LCIDS.has(lcid));
  };

  const selectedLocale = SUPPORTED_LCIDS.find(l => l.lcid === userLanguageId);
  const selectedLabel = selectedLocale ? `${selectedLocale.locale} (${selectedLocale.lcid})` : `${userLanguageId}`;

  return (
    <div className={styles.root}>
      <div className={styles.header}>User Settings</div>

      <div className={styles.field}>
        <Label size="small" htmlFor="user-language">Language (LCID)</Label>
        <Dropdown
          id="user-language"
          size="small"
          selectedOptions={[String(userLanguageId)]}
          value={selectedLabel}
          onOptionSelect={(_, d) => d.optionValue && onLanguageChange(Number(d.optionValue))}
        >
          {SUPPORTED_LCIDS.map(({ lcid, locale }) => (
            <Option key={lcid} value={String(lcid)} text={`${locale} (${lcid})`}>
              {locale} ({lcid})
            </Option>
          ))}
        </Dropdown>
        <span className={styles.hint}>Drives context.userSettings.languageId and the locale used for date/number formatting.</span>
      </div>

      <div className={styles.field}>
        <Switch
          checked={userIsRTL}
          onChange={(_, d) => setUserIsRTL(d.checked)}
          label="Right-to-left (isRTL)"
        />
      </div>

      <div className={styles.field}>
        <Label size="small" htmlFor="user-tz">Time zone offset (minutes from UTC)</Label>
        <Input
          id="user-tz"
          size="small"
          type="number"
          value={String(userTimeZoneOffsetMinutes)}
          onChange={(_, d) => {
            const n = Number(d.value);
            if (Number.isFinite(n)) setUserTimeZoneOffsetMinutes(Math.round(n));
          }}
        />
        <span className={styles.hint}>e.g. 0 = UTC, -300 = EST, 60 = CET. Returned by getTimeZoneOffsetMinutes().</span>
      </div>

      <div className={styles.field}>
        <Label size="small" htmlFor="user-id">User ID</Label>
        <Input
          id="user-id"
          size="small"
          value={userId}
          onChange={(_, d) => setUserId(d.value)}
        />
      </div>

      <div className={styles.field}>
        <Label size="small" htmlFor="user-name">User Name</Label>
        <Input
          id="user-name"
          size="small"
          value={userName}
          onChange={(_, d) => setUserName(d.value)}
        />
      </div>

      <div className={styles.field}>
        <Label size="small" htmlFor="user-roles">Security roles (one per line)</Label>
        <Textarea
          id="user-roles"
          size="small"
          rows={4}
          value={userSecurityRoles.join('\n')}
          onChange={(_, d) => setUserSecurityRoles(d.value.split('\n').map(r => r.trim()).filter(Boolean))}
        />
      </div>
    </div>
  );
}
