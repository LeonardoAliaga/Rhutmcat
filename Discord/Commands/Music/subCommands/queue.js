const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

module.exports = {
  async execute(interaction, discordClient) {
    const kazagumo = discordClient.kazagumo;
    const { options, member, channel, guild, user } = interaction;

    if (!kazagumo) {
      return interaction.reply({
        content: "Kazagumo no está inicializado.",
        ephemeral: true,
      });
    }

    // Aquí sigue el código de "reproducir" que ya tienes...
    player = kazagumo.getPlayer(guild.id);
    if (!player) {
      return interaction.reply("No hay nada reproduciéndose en este momento.");
    }
    if (player.queue.length === 0 && !player.current) {
      return interaction.reply("La cola está vacía.");
    }
    const tracks = player.queue
      .slice(0, 10)
      .map((track, index) => {
        return `**${index + 1}**. [${track.title}](${track.uri}) - *${
          track.author
        }* | \`${track.requester.username}\``;
      })
      .join("\n");
    const embed = new EmbedBuilder()
      .setColor("#dde3e3") // Puedes cambiar el color
      .setTitle("Lista de Reproducción")
      .setDescription(tracks.length > 0 ? tracks : "La cola está vacía.")
      .setTimestamp();

    // console.log(player.queue.current);
    // Si hay una canción reproduciéndose, la añadimos al principio del embed
    if (player.queue.current) {
      embed.setDescription(
        `**Reproduciendo ahora:**\n[${player.queue.current.title}](${
          player.queue.current.uri
        }) - *${player.queue.current.author}* | \`${
          player.queue.current.requester.username
        }\`\n\n${
          tracks.length > 0 ? "**Siguientes en la cola:**\n" + tracks : ""
        }`
      );
      embed.setThumbnail(player.queue.current.thumbnail);
    }
    // Si la cola es más larga de lo que mostramos, indicamos cuántas canciones más hay
    if (player.queue.length > 10) {
      embed.setFooter({
        text: `Y ${player.queue.length - 10} canción(es) más... | ${
          interaction.guild.name
        }`,
      });
    } else {
      embed.setFooter({
        text: `${interaction.guild.name}`,
      });
    }

    interaction.reply({ embeds: [embed] });
  },
};
