import { test } from 'tap';
import { PROGRAMS } from '../../src/data/programs';
import { t, tr } from '../../src/lib/i18n';

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
});

test('tr finds the right string', async tap => {
  tap.equal(
    tr(PROGRAMS['hopeForHomes'].name),
    'Federal Home Efficiency Rebates (HOMES)',
  );
  tap.equal(
    tr(PROGRAMS['hopeForHomes'].name, 'en'),
    'Federal Home Efficiency Rebates (HOMES)',
  );
  tap.equal(
    tr(PROGRAMS['hopeForHomes'].name, 'es'),
    'Reembolsos de Eficiencia en el Consumo de Energía en el Hogar (HOMES)',
  );
});
