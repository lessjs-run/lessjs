const command = new Deno.Command('git', {
  args: ['status', '--porcelain'],
  stdout: 'piped',
  stderr: 'piped',
});

const { code, stdout, stderr } = await command.output();

if (code !== 0) {
  const message = new TextDecoder().decode(stderr).trim();
  console.error(message || 'Failed to inspect git status.');
  Deno.exit(code);
}

const status = new TextDecoder().decode(stdout).trim();

if (status) {
  console.error('Refusing to publish from a dirty worktree:');
  console.error(status);
  Deno.exit(1);
}
