/**
 * Terminal API - powers the interactive terminal on the homepage.
 *
 * Commands: help, neofetch, build, ls, whoami, uname, version, clear, dsd
 * Mounted as a Hono sub-app at /api/term
 *
 * G11 fix: Command logic extracted to shared/term-commands.ts
 */
import { Hono } from 'hono';
import { executeTermCommand } from '../../shared/term-commands.ts';

const app = new Hono();

app.post('/', async (c) => {
  let body: { cmd?: unknown };
  try {
    body = await c.req.json<{ cmd?: unknown }>();
  } catch {
    return c.json({ output: ['invalid request: malformed JSON'] }, 400);
  }

  // v0.14.10: runtime type validation - cmd must be a string
  if (body.cmd !== undefined && typeof body.cmd !== 'string') {
    return c.json({ output: ['invalid command: expected string'] }, 400);
  }

  const cmd = (body.cmd as string | undefined) || '';
  const output = executeTermCommand(cmd);

  return c.json({ output });
});

export default app;
