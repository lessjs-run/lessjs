/**
 * Terminal API — powers the interactive terminal on the homepage.
 *
 * Commands: help, neofetch, build, ls, whoami, uname, version, clear, dsd
 * Mounted as a Hono sub-app at /api/term
 */
import { Hono } from 'hono';

const app = new Hono();

function neofetch(): string[] {
  return [
    '<span style="color:#7dd3fc;">       ████████████</span>',
    '<span style="color:#7dd3fc;">     ██            ██</span>',
    '<span style="color:#7dd3fc;">    ██   ────────   ██</span>',
    '<span style="color:#7dd3fc;">   ██   &lt; LessJS &gt;   ██</span>',
    '<span style="color:#7dd3fc;">    ██   ────────   ██</span>',
    '<span style="color:#7dd3fc;">     ██            ██</span>',
    '<span style="color:#7dd3fc;">       ████████████</span>',
    '',
    `<span style="color:#f4f4f5;">lessjs</span><span style="color:#52525b;">@</span><span style="color:#86efac;">v0.14.2</span>`,
    `<span style="color:#a1a1aa;">os</span>         deno 2.7+ / node 18+ / bun / cloudflare workers`,
    `<span style="color:#a1a1aa;">packages</span>  10`,
    `<span style="color:#a1a1aa;">tests</span>     475 passing`,
    `<span style="color:#a1a1aa;">core deps</span> 1 (parse5)`,
    `<span style="color:#a1a1aa;">license</span>   mit`,
    `<span style="color:#a1a1aa;">runtime</span>   zero node:* imports, zero vite deps`,
  ];
}

function buildSim(): string[] {
  return [
    '<span style="color:#fbbf24;">$</span> deno task build',
    '<span style="color:#52525b;">│</span> <span style="color:#7dd3fc;">less</span> v0.14.2 — ssg pipeline',
    '<span style="color:#52525b;">├─ phase 1</span> route scan  <span style="color:#52525b;">··</span> <span style="color:#86efac;">8 pages, 2 islands</span>',
    '<span style="color:#52525b;">├─ phase 2</span> client build <span style="color:#52525b;">··</span> <span style="color:#86efac;">2 island chunks (1.2 kb)</span>',
    '<span style="color:#52525b;">├─ phase 3</span> ssg render  <span style="color:#52525b;">··</span> <span style="color:#86efac;">8/8 pages rendered</span>',
    '<span style="color:#52525b;">│</span>  <span style="color:#c084fc;">↳</span> inject dsd templates',
    '<span style="color:#52525b;">│</span>  <span style="color:#c084fc;">↳</span> inject view transitions',
    '<span style="color:#52525b;">│</span>  <span style="color:#c084fc;">↳</span> generate sitemap',
    '<span style="color:#52525b;">└─</span> <span style="color:#86efac;">dist/ ready (24 files, 142 kb)</span>',
  ];
}

function ls(): string[] {
  return [
    '<span style="color:#7dd3fc;">app/routes/</span>',
    '├── <span style="color:#f4f4f5;">index.ts</span>        <span style="color:#52525b;">homepage</span>',
    '├── <span style="color:#f4f4f5;">guide/</span>           <span style="color:#52525b;">docs</span>',
    '├── <span style="color:#f4f4f5;">blog/</span>            <span style="color:#52525b;">posts</span>',
    '├── <span style="color:#f4f4f5;">api/</span>             <span style="color:#52525b;">hono routes</span>',
    '├── <span style="color:#f4f4f5;">decisions/</span>       <span style="color:#52525b;">adrs</span>',
    '<span style="color:#7dd3fc;">app/islands/</span>',
    '└── <span style="color:#f4f4f5;">less-term.ts</span>     <span style="color:#52525b;">← you are here</span>',
  ];
}

app.post('/', async (c) => {
  const body = await c.req.json<{ cmd: string }>();
  const cmd = body.cmd?.trim().toLowerCase() || '';

  let output: string[];

  switch (cmd) {
    case 'help':
      output = [
        '<span style="color:#86efac;">available commands:</span>',
        '  <span style="color:#fbbf24;">help</span>      show this message',
        '  <span style="color:#fbbf24;">neofetch</span>  display system info',
        '  <span style="color:#fbbf24;">version</span>   show lessjs version',
        '  <span style="color:#fbbf24;">build</span>     simulate ssg build',
        '  <span style="color:#fbbf24;">ls</span>        list project structure',
        '  <span style="color:#fbbf24;">whoami</span>    who are you?',
        '  <span style="color:#fbbf24;">uname</span>     print system info',
        '  <span style="color:#fbbf24;">dsd</span>       what is dsd?',
        '  <span style="color:#fbbf24;">clear</span>     clear terminal',
      ];
      break;

    case 'neofetch':
      output = neofetch();
      break;

    case 'version':
      output = ['<span style="color:#86efac;">v0.14.2</span> — standards & safety patch'];
      break;

    case 'build':
      output = buildSim();
      break;

    case 'ls':
      output = ls();
      break;

    case 'whoami':
      output = ['<span style="color:#a1a1aa;">you are a lessjs developer. welcome.</span>'];
      break;

    case 'uname':
      output = [
        '<span style="color:#86efac;">lessjs</span> <span style="color:#52525b;">deno 2.7+ node 18+ edge</span>',
      ];
      break;

    case 'dsd':
      output = [
        '<span style="color:#7dd3fc;">declarative shadow dom:</span>',
        'ssg renders your lit components into <span style="color:#fbbf24;">&lt;template shadowrootmode&gt;</span>',
        'browsers parse it natively — no js framework needed.',
        'content is visible <span style="color:#86efac;">before</span> javascript downloads.',
      ];
      break;

    case 'clear':
      output = ['__CLEAR__'];
      break;

    case '':
      output = [];
      break;

    default:
      output = [
        `<span style="color:#ef4444;">command not found:</span> ${cmd}. type <span style="color:#fbbf24;">help</span> for available commands.`,
      ];
  }

  return c.json({ output });
});

export default app;
