export default async ({ message }) => {
  await message.client.application.fetch();
  await message.guild.fetch();

  const reply = JSON.stringify(
    {
      message: {
        client: {
          application: {
            approximateGuildCount:
              message.client.application.approximateGuildCount,
            botPublic: message.client.application.botPublic,
          },
          user: {
            createdAt: message.client.user.createdAt,
            id: message.client.user.id,
            tag: message.client.user.tag,
          },
        },
        guild: {
          available: message.guild.available,
          id: message.guild.id,
          large: message.guild.large,
          members: {
            me: {
              displayName: message.guild.members.me.displayName,
              joinedAt: message.guild.members.me.joinedAt,
              permissions: {
                "toArray()": message.guild.members.me.permissions.toArray(),
              },
            },
          },
          memberCount: message.guild.memberCount,
          name: message.guild.name,
        },
      },
    },
    null,
    2
  );

  return await message.reply({
    files: [
      {
        attachment: Buffer.from(reply),
        name: "debug.json",
      },
    ],
  });
};
