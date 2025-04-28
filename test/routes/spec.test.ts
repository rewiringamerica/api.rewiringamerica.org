import { Error, validate } from 'oas-validator';
import { test } from 'tap';
import { build } from '../helper';

test('OpenAPI spec is valid', async t => {
  const app = await build(t);

  const response = await app.inject({ url: '/spec.json' });

  try {
    await validate(await response.json(), { lint: false });
  } catch (err) {
    const errTyped = err as Error;
    t.fail(`${errTyped.options.context.pop()}: ${errTyped.message}`);
  }
});
