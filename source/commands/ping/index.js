export async function handlePingCommand(interaction) {
  const startTime = Date.now();
  await interaction.editReply("Pong!");

  const latency = Date.now() - startTime;
  const apiLatency = Math.round(interaction.client.ws.ping);

  await interaction.editReply(
    `🏓 Pong!\n**Response Time:** ${latency}ms\n**API Latency:** ${apiLatency}ms`
  );
}