const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVariables, fillTemplate, hasVariables } = require('../../prompt-manager/lib/template.js');

test('parses simple variables in order, unique', () => {
  const v = parseVariables('Hi {{name}}, about {{ topic }}. Bye {{name}}');
  assert.deepEqual(v, [{ name: 'name', default: undefined }, { name: 'topic', default: undefined }]);
});
test('parses defaults incl. spaces and empty default', () => {
  const v = parseVariables('{{tone|friendly}} {{len| 3 short paragraphs }} {{x|}}');
  assert.deepEqual(v, [{ name: 'tone', default: 'friendly' }, { name: 'len', default: '3 short paragraphs' }, { name: 'x', default: '' }]);
});
test('first default wins; later default fills a missing one', () => {
  assert.equal(parseVariables('{{a|1}} {{a|2}}')[0].default, '1');
  assert.equal(parseVariables('{{a}} {{a|2}}')[0].default, '2');
});
test('unicode (Turkish) names and case-insensitive merge', () => {
  const v = parseVariables('{{şehir|İstanbul}} {{Şehir}} {{dil}}');
  assert.equal(v.length, 2);
  assert.equal(v[0].name, 'şehir');
  assert.equal(fillTemplate('{{şehir|İstanbul}}/{{Şehir}}', {}), 'İstanbul/');
});
test('ignores malformed and escaped placeholders', () => {
  assert.deepEqual(parseVariables('{{}} {{ }} {single} {{a{b}} \\{{lit}}'), []);
  assert.equal(fillTemplate('keep \\{{lit}} and {{x|y}}', {}), 'keep {{lit}} and y');
});
test('fill: values, defaults, missing -> empty', () => {
  const body = 'Write to {{name}} in a {{tone|friendly}} tone about {{topic}}.';
  assert.equal(fillTemplate(body, { name: 'Ayşe', topic: 'invoice' }), 'Write to Ayşe in a friendly tone about invoice.');
  assert.equal(fillTemplate(body, { name: 'A', tone: 'formal', topic: 'b' }), 'Write to A in a formal tone about b.');
  assert.equal(fillTemplate(body, {}), 'Write to  in a friendly tone about .');
});
test('fill is single-pass (values are not re-expanded)', () => {
  assert.equal(fillTemplate('{{a}} {{b|B}}', { a: '{{b}}' }), '{{b}} B');
});
test('multiline body and special regex chars in values', () => {
  assert.equal(fillTemplate('x\n{{v}}\ny', { v: '$& $1 \\n' }), 'x\n$& $1 \\n\ny');
});
test('hasVariables / non-string input', () => {
  assert.equal(hasVariables('plain text'), false);
  assert.equal(hasVariables('{{a}}'), true);
  assert.deepEqual(parseVariables(null), []);
  assert.equal(fillTemplate(undefined), '');
});
