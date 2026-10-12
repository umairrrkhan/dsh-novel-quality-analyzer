import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import('react-dom/client');
let registeredModule;
dom.window.__ModuleLoader__ = { load(module) { registeredModule = module; } };
vm.runInContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), vm.createContext({
  window: dom.window, navigator: dom.window.navigator, setTimeout, clearTimeout,
}));
const h = React.createElement;
const primitives = {
  Button: ({ children, ...props }) => h('button', props, children),
  Modal: ({ open, title, closeLabel, onClose, children }) => open ? h('section', { role: 'dialog', 'aria-label': title },
    h('button', { type: 'button', 'aria-label': closeLabel, onClick: onClose }, closeLabel), children) : null,
};
const plugin = registeredModule.factory((name) => {
  if (name === 'react') return React;
  if (name === '@deepseek-ai/dsh-client-ui-primitives') return primitives;
  throw new Error(`Unexpected client dependency: ${name}`);
});
let component;
let entry;
let translations;
let localeDisposed = false;
let slotDisposed = false;
const disposers = [];
const ctx = {
  effect(fn) { disposers.push(fn()); },
  locale: { register(namespace, dictionaries) {
    assert.equal(namespace, 'novelQuality'); translations = dictionaries;
    return () => { localeDisposed = true; };
  } },
  slots: {
    inject(name, fn) { assert.equal(name, 'conversation.input.right'); disposers.push(fn()); },
    register(metadata, Component) {
      entry = metadata; component = Component;
      return () => { slotDisposed = true; };
    },
  },
};
const root = createRoot(document.getElementById('root'));
const t = (key) => translations.en[key] ?? key;
const sleep = () => new Promise((resolve) => setTimeout(resolve, 300));
const button = (label) => [...document.querySelectorAll('button')].find((node) => node.textContent.includes(label));
const click = async (element) => { assert.ok(element); await act(async () => element.click()); };
async function fill(text) {
  const field = document.querySelector('textarea:not([readonly])');
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value').set.call(field, text);
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    field.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  await act(sleep);
}

test('module identity and activation use the published protocol without React hooks in apply', async () => {
  assert.equal(registeredModule.id, 'dsh-novel-quality-analyzer');
  assert.deepEqual(Array.from(plugin.inject), ['slots', 'locale']);
  assert.doesNotThrow(() => plugin.apply(ctx));
  assert.equal(entry.id, 'novel-quality-analyzer');
  assert.equal(entry.locale, 'novelQuality');
  assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.zh).sort());
  await act(async () => root.render(h(component, { t })));
  assert.ok(button('Analyze writing'));
});

test('opening an empty analyzer always displays the editable text field and close control', async () => {
  await click(button('Analyze writing'));
  assert.ok(document.querySelector('[role="dialog"]'));
  assert.ok(document.querySelector('textarea:not([readonly])'));
  assert.match(document.body.textContent, /Paste text to see diagnostics/);
  assert.ok(button('Close analyzer'));
});

test('typing renders actual analysis and repeated occurrence evidence', async () => {
  await fill('Suddenly, the lantern flickered. Suddenly, the keeper stopped. '.repeat(6));
  assert.match(document.body.textContent, /Cliché occurrences: 12/);
  assert.match(document.body.textContent, /lantern: 6/);
  assert.match(document.body.textContent, /Heuristic flags/);
});

test('copy action exports the report and handles unavailable clipboard', async () => {
  let copied;
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { copied = text; } } });
  await click(button('Copy report'));
  assert.match(copied, /Cliche occurrences: 12/);
  assert.match(document.body.textContent, /Report copied/);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  await click(button('Copy report'));
  assert.match(document.body.textContent, /Clipboard unavailable/);
});

test('oversized text reports an actionable error instead of freezing or showing stale results', async () => {
  await fill('a'.repeat(200_001));
  assert.match(document.querySelector('[role="alert"]').textContent, /shorter excerpt/);
  assert.ok(!document.querySelector('textarea[readonly]'));
});

test('HTML-like story content is rendered as text and short samples are unscored', async () => {
  await fill('<img src=x onerror=alert(1)> Suddenly, the story begins.');
  assert.equal(document.querySelectorAll('img, script').length, 0);
  assert.match(document.body.textContent, /Not scored/);
});

test('clear and close reset private text and cancel pending analysis', async () => {
  await click(button('Clear excerpt'));
  assert.equal(document.querySelector('textarea').value, '');
  await click(button('Close analyzer'));
  assert.equal(document.querySelector('[role="dialog"]'), null);
  await click(button('Analyze writing'));
  assert.equal(document.querySelector('textarea').value, '');
  await click(button('Close analyzer'));
});

test('disposing the plugin unregisters slot and locale effects', () => {
  for (const dispose of disposers.reverse()) dispose();
  assert.ok(localeDisposed);
  assert.ok(slotDisposed);
});

after(async () => { await act(async () => root.unmount()); dom.window.close(); });
