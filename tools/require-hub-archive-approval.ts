const allow = Deno.env.get('OPEN_ELEMENT_ALLOW_ARCHIVED_HUB_WRITE') === '1';

if (!allow) {
  console.error(
    [
      'Hub write tasks are archived in v0.40 by ADR-0103.',
      'Set OPEN_ELEMENT_ALLOW_ARCHIVED_HUB_WRITE=1 only for approved historical maintenance.',
    ].join('\n'),
  );
  Deno.exit(1);
}
