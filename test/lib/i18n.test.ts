import { t } from '../../src/lib/i18n.js';
import { test } from 'tap';

test('t finds the right string', async tap => {
  tap.equal(
    t('items', 'batteryStorageInstallation'),
    'Battery Storage Installation',
  );
  tap.equal(
    t('items', 'batteryStorageInstallation', 'en'),
    'Battery Storage Installation',
  );
  tap.equal(
    t('items', 'batteryStorageInstallation', 'es'),
    'Instalación de baterías',
  );
  tap.equal(t('programs', 'hopeForHomes'), 'Hope for Homes (HOMES)');
  tap.equal(t('programs', 'hopeForHomes', 'en'), 'Hope for Homes (HOMES)');
  tap.equal(
    t('programs', 'hopeForHomes', 'es'),
    'Esperanza para los hogares (HOMES)',
  );
});
