import { assertEquals } from 'jsr:@std/assert@1';
import * as protocols from '../src/index.ts';

Deno.test('@lessjs/protocols remains a zero-runtime type contract package', () => {
  assertEquals(Object.keys(protocols), []);
});
