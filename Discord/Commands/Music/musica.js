const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
} = require("discord.js");
const { Kazagumo } = require("kazagumo");
// const { options, voice } = require("../../DiscordClient");

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
    ),

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   * @param {Kazagumo} [kazagumo = discordClient.kazagumo]
   * @param {Client} discordClient
   */
  async execute(interaction) {
    const discordClient = interaction.client;
    const kazagumo = discordClient.kazagumo;

    if (!kazagumo) {
      return interaction.reply({
        content: "Kazagumo no está inicializado.",
        ephemeral: true,
      });
    }
    const { options, member, channel, guild, user } = interaction;

    let player;
    switch (options.getSubcommand()) {
      case "reproducir":
        const voiceChannel = member.voice.channel;
        if (!voiceChannel)
          return interaction.reply("No se ha conectado a un canal de voz");

        const query = options.getString("nombre");

        await interaction.reply({
          content: `Buscando **${query}**`,
        });

        try {
          player = await kazagumo.createPlayer({
            guildId: guild.id,
            textId: channel.id,
            voiceId: voiceChannel.id,
          });

          let result = await kazagumo.search(query, { requester: user });
          if (!result.tracks.length)
            return interaction.reply("No se han encontrado resultados");

          if (result.type === "PLAYLIST") player.queue.add(result.tracks);
          else player.queue.add(result.tracks[0]);

          if (!player.playing && !player.paused) player.play();
          await interaction.followUp({
            content:
              result.type === "PLAYLIST"
                ? `Se ha agregado a la lista ${result.playlistName}`
                : `Se ha agregado a la lista ${result.tracks[0].title}`,
          });
        } catch (error) {
          console.log(error);
        }
        break;
      case "parar":
        player = kazagumo.getPlayer(guild.id);

        if (!player)
          return interaction.reply("No se está reproduciendo musica");
        await player.destroy();
        await interaction.reply("Listo.");
        break;
      default:
        break;
    }
  },
};
