import { t, walk } from '../../lib/i18n.js';
import { test } from 'tap';

test('t finds the right string', async tap => {
  tap.equal(
    t('items.batteryStorageInstallation'),
    'Battery Storage Installation',
  );
  tap.equal(
    t('items.batteryStorageInstallation', 'en'),
    'Battery Storage Installation',
  );
  tap.equal(
    t('items.batteryStorageInstallation', 'es'),
    'Instalación de baterías',
  );
});

test('walk does the right thing', async tap => {
  const translations = { a: { b: { c: 'hi' } } };
  const path = 'a.b.c'.split('.');
  tap.equal(walk(translations, path), 'hi');
});

test('walk does the right thing with single string path', async tap => {
  const translations = { c: 'hi' };
  const path = ['c'];
  tap.equal(walk(translations, path), 'hi');
});
