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

    if (!player) return interaction.reply("No se está reproduciendo musica");
    await player.destroy();
    await interaction.reply("Listo.");
  },
};
