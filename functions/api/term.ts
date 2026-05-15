/**
 * Cloudflare Pages Function — /api/term
 *
 * Handles terminal commands for the interactive homepage demo.
 * Deployed as a Pages Function, not part of the SSG build.
 *
 * @see https://developers.cloudflare.com/pages/functions/
 */
interface TermBody {
  cmd?: string;
}

/** Escape HTML entities — prevents reflected XSS when cmd is embedded in HTML response (C-07 fix). */
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const NEOCAT = [
  '<span style="color:#7dd3fc;">       ████████████</span>',
  '<span style="color:#7dd3fc;">     ██            ██</span>',
  '<span style="color:#7dd3fc;">    ██   ────────   ██</span>',
  '<span style="color:#7dd3fc;">   ██   &lt; LessJS &gt;   ██</span>',
  '<span style="color:#7dd3fc;">    ██   ────────   ██</span>',
  '<span style="color:#7dd3fc;">     ██            ██</span>',
  '<span style="color:#7dd3fc;">       ████████████</span>',
  '',
  '<span style="color:#f4f4f5;">lessjs</span><span style="color:#52525b;">@</span><span style="color:#86efac;">v0.14.7</span>',
  '<span style="color:#a1a1aa;">os</span>         deno 2.7+ / node 18+ / bun / cloudflare workers',
  '<span style="color:#a1a1aa;">packages</span>  10',
  '<span style="color:#a1a1aa;">tests</span>     475 passing',
  '<span style="color:#a1a1aa;">core deps</span> 1 (parse5)',
  '<span style="color:#a1a1aa;">license</span>   mit',
  '<span style="color:#a1a1aa;">runtime</span>   zero node:* imports, zero vite deps',
];

const BUILD = [
  '<span style="color:#fbbf24;">$</span> deno task build',
  '<span style="color:#52525b;">│</span> <span style="color:#7dd3fc;">less</span> v0.14.7 — ssg pipeline',
  '<span style="color:#52525b;">├─ phase 1</span> route scan  <span style="color:#52525b;">··</span> <span style="color:#86efac;">8 pages, 2 islands</span>',
  '<span style="color:#52525b;">├─ phase 2</span> client build <span style="color:#52525b;">··</span> <span style="color:#86efac;">2 island chunks (1.2 kb)</span>',
  '<span style="color:#52525b;">├─ phase 3</span> ssg render  <span style="color:#52525b;">··</span> <span style="color:#86efac;">8/8 pages rendered</span>',
  '<span style="color:#52525b;">│</span>  <span style="color:#c084fc;">↳</span> inject dsd templates',
  '<span style="color:#52525b;">│</span>  <span style="color:#c084fc;">↳</span> inject view transitions',
  '<span style="color:#52525b;">│</span>  <span style="color:#c084fc;">↳</span> generate sitemap',
  '<span style="color:#52525b;">└─</span> <span style="color:#86efac;">dist/ ready (24 files, 142 kb)</span>',
];

const LS = [
  '<span style="color:#7dd3fc;">app/routes/</span>',
  '├── <span style="color:#f4f4f5;">index.ts</span>        <span style="color:#52525b;">homepage</span>',
  '├── <span style="color:#f4f4f5;">guide/</span>           <span style="color:#52525b;">docs</span>',
  '├── <span style="color:#f4f4f5;">blog/</span>            <span style="color:#52525b;">posts</span>',
  '├── <span style="color:#f4f4f5;">api/</span>             <span style="color:#52525b;">hono routes</span>',
  '├── <span style="color:#f4f4f5;">decisions/</span>       <span style="color:#52525b;">adrs</span>',
  '<span style="color:#7dd3fc;">app/islands/</span>',
  '└── <span style="color:#f4f4f5;">less-term.ts</span>     <span style="color:#52525b;">terminal island</span>',
];

export async function onRequest(context: {
  request: Request;
  env: Record<string, string>;
  params: Record<string, string>;
}): Promise<Response> {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (context.request.method !== 'POST') {
    return new Response(
      JSON.stringify({ output: ['<span style="color:#ef4444;">method not allowed</span>'] }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    );
  }

  let cmd = '';
  try {
    const body: TermBody = await context.request.json();
    cmd = (body.cmd || '').trim().toLowerCase();
  } catch {
    return new Response(
      JSON.stringify({ output: ['<span style="color:#ef4444;">invalid json</span>'] }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  let output: string[];

  switch (cmd) {
    case 'build':
      output = BUILD;
      break;
    case 'ls':
      output = LS;
      break;
    case 'neofetch':
      output = NEOCAT;
      break;
    case 'clear':
      output = ['__CLEAR__'];
      break;
    default:
      output = [`<span style="color:#ef4444;">command not found:</span> ${escapeHtml(cmd)}`];
  }

  return new Response(JSON.stringify({ output }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
