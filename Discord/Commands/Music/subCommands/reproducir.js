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

    // Aquí sigue el código de "reproducir" que ya tienes...

    const voiceChannel = member.voice.channel;
    if (!voiceChannel)
      return interaction.reply("No se ha conectado a un canal de voz");

    const query = options.getString("nombre");

    await interaction.reply({
      content: `Buscando **${query}**`,
    });

    try {
      let result = await kazagumo.search(query, { requester: user });
      // console.log(result.type);
      // console.log(result);

      if (result.type === "PLAYLIST") {
        player = await kazagumo.createPlayer({
          guildId: guild.id,
          textId: channel.id,
          voiceId: voiceChannel.id,
        });
        if (!result.tracks.length)
          return interaction.reply("No se han encontrado resultados");
        for (const track of result.tracks) {
          await player.queue.add(track);
        }
        // Iniciar la reproducción si el reproductor no está activo
        if (!player.playing && !player.paused) {
          await player.play();
        }
        let tracks = result.tracks
          .slice(0, 5)
          .map((track, index) => {
            return `**${index + 1}**. [${track.title}](${track.uri}) - \`${
              track.author
            }\` | *${track.requester.username}*`;
          })
          .join("\n");
        return interaction.editReply({
          content: "",
          embeds: [
            new EmbedBuilder()
              .setColor("#dde3e3") // Color verde para éxito
              .setTitle(`Lista de Reproducción Añadida`)
              .setDescription(
                `[${result.playlistName}](${query})\nSe añadieron **${result.tracks.length}** canciones de la lista de reproducción a la cola.\n\n${tracks}`
              )
              .setThumbnail(interaction.user.avatarURL())
              .setImage(result.tracks[0].thumbnail)
              .setTimestamp(),
          ],
        });
      } else if (result.type === "TRACK") {
        player = await kazagumo.createPlayer({
          guildId: guild.id,
          textId: channel.id,
          voiceId: voiceChannel.id,
        });
        // return interaction.editReply("aea");
        if (!result.tracks.length)
          return interaction.reply("No se han encontrado resultados");

        await player.queue.add(result.tracks[0]);
        // Iniciar la reproducción si el reproductor no está activo
        if (!player.playing && !player.paused) {
          await player.play();
        }
        return interaction.editReply(
          `Se añadió correctamente [${result.tracks[0].title}](${result.tracks[0].uri})`
        );
      } else if (result.type === "SEARCH") {
        const top10Results = result.tracks.slice(0, 10);
        const embed = new EmbedBuilder()
          .setColor("#dde3e3")
          .setTitle(`Resultados de búsqueda para: "${query}"`)
          // Cambiamos la descripción para el menú de selección
          .setDescription("Selecciona una canción del menú desplegable:")
          .setTimestamp();

        const selectOptions = top10Results.map((track, index) => {
          const displayTitle =
            track.title.length > 50
              ? `${track.title.substring(0, 47)}...`
              : track.title;
          const description = `Autor: ${
            track.author || "Desconocido"
          } | Duración: ${discordClient.utils.formatDuration(track.length)}`;

          return new StringSelectMenuOptionBuilder()
            .setLabel(`${index + 1}. ${displayTitle}`)
            .setDescription(
              description.length > 100
                ? description.substring(0, 97) + "..."
                : description
            ) // Descripción limitada a 100 chars
            .setValue(index.toString()); // El valor que se enviará al seleccionar (el índice)
        });

        // Si no hay resultados para mostrar en el menú
        if (selectOptions.length === 0) {
          return interaction.editReply(
            "No se encontraron canciones individuales para tu búsqueda."
          );
        }

        // Creamos el menú desplegable
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select_track_menu_${interaction.user.id}`) // ID único para el menú
          .setPlaceholder("Elige una canción de la lista...")
          .addOptions(selectOptions);

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const replyMessage = await interaction.channel.send({
          embeds: [embed],
          components: [actionRow], // Adjuntamos el ActionRow con el menú
          fetchReply: true,
        });

        discordClient.activeSearches = new Map();
        discordClient.activeSearches.set(replyMessage.id, {
          results: top10Results,
          userId: interaction.user.id,
          channelId: interaction.channel.id,
        });

        setTimeout(() => {
          if (discordClient.activeSearches.has(replyMessage.id)) {
            replyMessage
              .edit({
                components: [
                  new ActionRowBuilder().addComponents(
                    StringSelectMenuBuilder.from(selectMenu).setDisabled(true) // Deshabilita el menú
                  ),
                ],
              })
              .catch((e) => console.error("Error al deshabilitar el menú:", e));
            discordClient.activeSearches.delete(replyMessage.id);
          }
        }, 60000); // 60 segundos para seleccionar
      } else {
        await interaction.editReply("No se encontraron resultados.");
      }
    } catch (error) {
      // return interaction.editReply("aea");
      console.log(error);
    }
  },
};
