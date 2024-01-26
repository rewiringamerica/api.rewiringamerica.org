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
    tr(PROGRAMS['homeEfficiencyRebates'].name),
    'Federal Home Efficiency Rebates (HER)',
  );
  tap.equal(
    tr(PROGRAMS['homeEfficiencyRebates'].name, 'en'),
    'Federal Home Efficiency Rebates (HER)',
  );
  tap.equal(
    tr(PROGRAMS['homeEfficiencyRebates'].name, 'es'),
    'Reembolsos de Eficiencia en el Consumo de Energía en el Hogar (HER)',
  );
});
