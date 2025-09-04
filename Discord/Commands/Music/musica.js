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
  data: new SlashCommandBuilder()
    .setName("musica")
    .setDescription("Nada mejor que hacer las cosas con musica")
    .addSubcommand((subCommand) =>
      subCommand
        .setName("reproducir")
        .setDescription("Reproduce una cancion")
        .addStringOption((options) =>
          options
            .setName("nombre")
            .setDescription("El nombre de la cancion")
            .setRequired(true)
        )
    )
    .addSubcommand((subCommand) =>
      subCommand.setName("parar").setDescription("Para la musica")
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("queue")
        .setDescription("consulta la lista de reproduccion")
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("pause")
        .setDescription("Pausa la canción que se esta reproduciendo")
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("reanudar")
        .setDescription("Continua escuchando tu canción")
    ),

  async execute(interaction) {
    const discordClient = interaction.client;
    const subcommand = interaction.options.getSubcommand();

    try {
      const subcommandFile = require(`./subcommands/${subcommand}.js`);
      await subcommandFile.execute(interaction, discordClient);
    } catch (err) {
      console.error(`Error al ejecutar subcomando ${subcommand}:`, err);
      await interaction.reply({
        content: "Hubo un error al ejecutar este subcomando.",
        ephemeral: true,
      });
    }
  },
};
