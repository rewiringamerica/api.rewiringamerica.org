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
  tap.equal(
    t('programs', 'hopeForHomes'),
    'Federal Home Efficiency Rebates (HOMES)',
  );
  tap.equal(
    t('programs', 'hopeForHomes', 'en'),
    'Federal Home Efficiency Rebates (HOMES)',
  );
  tap.equal(
    t('programs', 'hopeForHomes', 'es'),
    'Reembolsos de Eficiencia en el Consumo de Energía en el Hogar (HOMES)',
  );
});
