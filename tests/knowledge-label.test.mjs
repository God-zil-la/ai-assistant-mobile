import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');

test('Knowledge refresh button has the new label and retains its action and disabled state', () => {
  const source = readFileSync(new URL('../src/screens/KnowledgeScreen.js', import.meta.url), 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const buttons = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement' && node.name.name === 'ActionButton') buttons.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast);
  const matches = buttons.filter(node => node.attributes.some(attr => attr.name?.name === 'title' && attr.value?.value === 'Refresh file list'));
  assert.equal(matches.length, 1);
  assert.doesNotMatch(source, /Refresh knowledge/i);
  const attribute = name => matches[0].attributes.find(attr => attr.name?.name === name).value.expression;
  assert.equal(attribute('onPress').name, 'load');
  const disabled = attribute('disabled');
  assert.equal(disabled.operator, '||');
  assert.equal(disabled.left.name, 'busy');
  assert.equal(disabled.right.name, 'loading');
});
