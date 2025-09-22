export { handleTrackerAdd } from './add.js';
export { handleTrackerRemove } from './remove.js';
export { handleTrackerList } from './list.js';
export { handleTrackerClear } from './clear.js';
export { handleTrackerRename } from './rename.js';
export { handleTrackerSearch } from './search.js';
export { handleTrackerAudit } from './audit.js';

export async function handleTrackerCommand(interaction) {
  const subcommand = interaction.options.getSubcommand();

  const { handleTrackerAdd } = await import('./add.js');
  const { handleTrackerRemove } = await import('./remove.js');
  const { handleTrackerList } = await import('./list.js');
  const { handleTrackerClear } = await import('./clear.js');
  const { handleTrackerRename } = await import('./rename.js');
  const { handleTrackerSearch } = await import('./search.js');
  const { handleTrackerAudit } = await import('./audit.js');

  const handlers = {
    add: handleTrackerAdd,
    remove: handleTrackerRemove,
    list: handleTrackerList,
    clear: handleTrackerClear,
    rename: handleTrackerRename,
    search: handleTrackerSearch,
    audit: handleTrackerAudit
  };

  const handler = handlers[subcommand];
  if (!handler) {
    throw new Error(`Unknown tracker subcommand: ${subcommand}`);
  }

  await handler(interaction);
}