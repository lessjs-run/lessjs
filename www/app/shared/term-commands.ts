/**
 * Shared term command handler - used by both the Hono API route
 * and the Cloudflare Pages Function.
 *
 * G11 fix: Deduplicated command logic from:
 *   - www/app/routes/api/term.ts (Hono route)
 *   - functions/api/term.ts (Cloudflare Pages Function)
 */

/** Escape HTML entities - prevents reflected XSS in command responses. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const VERSION = '0.14.11';

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
    `<span style="color:#f4f4f5;">lessjs</span><span style="color:#52525b;">@</span><span style="color:#86efac;">v${VERSION}</span>`,
    `<span style="color:#a1a1aa;">os</span>         deno 2.7+ / node 18+ / bun / cloudflare workers`,
    '<span style="color:#a1a1aa;">packages</span>  10',
    '<span style="color:#a1a1aa;">tests</span>     475 passing',
    '<span style="color:#a1a1aa;">core deps</span> 1 (parse5)',
    '<span style="color:#a1a1aa;">license</span>   mit',
    '<span style="color:#a1a1aa;">runtime</span>   zero node:* imports, zero vite deps',
  ];
}

function buildSim(): string[] {
  return [
    '<span style="color:#fbbf24;">$</span> deno task build',
    `<span style="color:#52525b;">│</span> <span style="color:#7dd3fc;">less</span> v${VERSION} - ssg pipeline`,
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

/**
 * Execute a terminal command and return its output lines.
 * Shared between the Hono API route and Cloudflare Pages Function.
 */
export function executeTermCommand(rawCmd: string): string[] {
  const cmd = rawCmd.trim().toLowerCase();

  switch (cmd) {
    case 'help':
      return [
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

    case 'neofetch':
      return neofetch();

    case 'version':
      return [
        `<span style="color:#86efac;">v${VERSION}</span> - security hardening, circular dep fix, code hygiene`,
      ];

    case 'build':
      return buildSim();

    case 'ls':
      return ls();

    case 'whoami':
      return ['<span style="color:#a1a1aa;">you are a lessjs developer. welcome.</span>'];

    case 'uname':
      return [
        '<span style="color:#86efac;">lessjs</span> <span style="color:#52525b;">deno 2.7+ node 18+ edge</span>',
      ];

    case 'dsd':
      return [
        '<span style="color:#7dd3fc;">declarative shadow dom:</span>',
        'ssg renders your lit components into <span style="color:#fbbf24;">&lt;template shadowrootmode&gt;</span>',
        'browsers parse it natively - no js framework needed.',
        'content is visible <span style="color:#86efac;">before</span> javascript downloads.',
      ];

    case 'clear':
      return ['__CLEAR__'];

    case '':
      return [];

    default:
      return [
        `<span style="color:#ef4444;">command not found:</span> ${
          escapeHtml(cmd)
        }. type <span style="color:#fbbf24;">help</span> for available commands.`,
      ];
  }
}
