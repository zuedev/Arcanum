export default async function messageDiscordId(discord_id, message) {
  const user = await discord.users.fetch(discord_id);

  try {
    await user.send(message);
  } catch (error) {
    console.error(
      `Failed to send message to "${discord_id}" discord ID: ${error}`
    );
  }
}
