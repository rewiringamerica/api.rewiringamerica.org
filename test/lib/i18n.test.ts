import { test } from 'tap';
import { t } from '../../src/lib/i18n';

test('t finds the right string', async tap => {
  tap.equal(
    t('items', 'battery_storage_installation'),
    'Battery Storage Installation',
  );
  tap.equal(
    t('items', 'battery_storage_installation', 'en'),
    'Battery Storage Installation',
  );
  tap.equal(
    t('items', 'battery_storage_installation', 'es'),
    'Instalación de baterías',
  );
  tap.equal(t('programs', 'hopeForHomes'), 'Hope for Homes (HOMES)');
  tap.equal(t('programs', 'hopeForHomes', 'en'), 'Hope for Homes (HOMES)');
  tap.equal(
    t('programs', 'hopeForHomes', 'es'),
    'Esperanza para los hogares (HOMES)',
  );
});
