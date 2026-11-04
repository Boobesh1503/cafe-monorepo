import assert from 'node:assert/strict';
import test from 'node:test';
import { contactSubmissionSchema, menuItemSchema } from './index.js';

test('menu contract rejects negative prices', () => {
  assert.equal(
    menuItemSchema.safeParse({
      id: 'espresso',
      name: 'Espresso',
      description: 'Short and rich.',
      priceCents: -1,
      category: 'coffee',
    }).success,
    false,
  );
});

test('contact contract validates reasonable length and email', () => {
  assert.equal(
    contactSubmissionSchema.safeParse({
      name: 'Avery',
      email: 'avery@example.test',
      message: 'Hello, I would like to ask about your opening hours.',
    }).success,
    true,
  );
});
