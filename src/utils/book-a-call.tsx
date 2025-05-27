import Cal, { getCalApi } from '@calcom/embed-react';
import { useEffect } from 'react';

export default function BookACall() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: '30min' });
      cal('ui', {
        cssVarsPerTheme: { light: { 'cal-brand': '#7E64A4' }, dark: { 'cal-brand': '#6E2765' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })();
  }, []);
  return (
    <Cal
      namespace="30min"
      calLink="resonantprojects/30min"
      style={{ width: '100%', height: '100%', overflow: 'scroll' }}
      config={{ layout: 'month_view' }}
    />
  );
}
