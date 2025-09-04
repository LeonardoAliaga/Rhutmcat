// Discord/Events/Client/InteractionCreate.js

const {
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  // Asegúrate de que todas las dependencias necesarias estén aquí
  // Por ejemplo, si usas EmbedBuilder en este archivo, impórtalo también:
  // EmbedBuilder
} = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const discordClient = interaction.client;

    // // --- MANEJO DE COMANDOS DE BARRA (SLASH COMMANDS) ---
    if (interaction.isChatInputCommand()) {
      const command = discordClient.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `No se encontró el comando de barra: ${interaction.commandName}.`
        );
        return; // IMPORTANTE: Termina la ejecución si no se encuentra el comando
      }

      try {
        await command.execute(interaction, discordClient); // Pasa el objeto 'client' al comando
      } catch (error) {
        console.error(
          `Error al ejecutar el comando ${interaction.commandName}:`,
          error
        );
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "Hubo un error al ejecutar este comando.",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "Hubo un error al ejecutar este comando.",
            ephemeral: true,
          });
        }
      }
      return; // MUY IMPORTANTE: Termina la ejecución después de manejar un comando de barra.
    }

    const command = discordClient.commands.get(interaction.commandName);

    // Mostrar los comandos una sola vez
    if (!discordClient._hasPrintedCommands) {
      const tableData = [];

      discordClient.commands.forEach((cmd, name) => {
        if (!cmd.data || !cmd.data.options) return;

        const subcommands = cmd.data.options.filter((opt) => opt.type === 1); // 1 = Subcommand
        if (subcommands.length > 0) {
          for (const sub of subcommands) {
            tableData.push({ Comando: `✅ /${name} ${sub.name}` });
          }
        } else {
          tableData.push({ Comando: `✅ /${name}` });
        }
      });

      console.log("\n📋 Comandos Slash Registrados:\n");
      console.table(tableData);
      console.log(`Total: ${tableData.length} comandos\n`);

      discordClient._hasPrintedCommands = true;
    }

    // --- MANEJO DE MENÚS DESPLEGABLES (STRING SELECT MENUS) ---
    // Esta verificación SÓLO se ejecutará si la interacción NO fue un comando de barra.
    if (interaction.isStringSelectMenu()) {
      // Ahora es seguro acceder a customId, porque 'isStringSelectMenu()' es true.
      if (interaction.customId.startsWith("select_track_menu_")) {
        const parts = interaction.customId.split("_");
        const originalUserId = parts[3];

        if (interaction.user.id !== originalUserId) {
          return interaction.reply({
            content:
              "Solo el usuario que inició la búsqueda puede seleccionar una canción de este menú.",
            ephemeral: true,
          });
        }

        const selectedIndex = parseInt(interaction.values[0]);
        const searchData = discordClient.activeSearches.get(
          interaction.message.id
        );

        if (!searchData || searchData.userId !== interaction.user.id) {
          return interaction.reply({
            content:
              "Esta búsqueda ha expirado o no tienes permiso para usarla.",
            ephemeral: true,
          });
        }

        const selectedTrack = searchData.results[selectedIndex];

        if (!selectedTrack) {
          return interaction.reply({
            content: "No se pudo encontrar esa canción. Inténtalo de nuevo.",
            ephemeral: true,
          });
        }

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
          return interaction.reply({
            content: "Debes estar en un canal de voz para reproducir música.",
            ephemeral: true,
          });
        }

        // --- INICIO DE LA DEPURACIÓN MEJORADA ---
        let player = discordClient.kazagumo.players.get(interaction.guild.id);

        if (!player) {
          console.log(
            `[DEBUG] Creating new player for guild ${interaction.guild.id}`
          );
          player = await discordClient.kazagumo.createPlayer({
            guildId: interaction.guild.id,
            voiceId: voiceChannel.id,
            textId: interaction.channel.id,
            deaf: true,
          });
        }

        try {
          await player.queue.add(selectedTrack);
          if (!player.playing && !player.paused) {
            await player.play();
          }

          await interaction.reply({
            content: `🎵 Se añadió **[${selectedTrack.title}](${selectedTrack.uri})** a la cola.`,
            ephemeral: true,
          });

          const originalMessage = interaction.message;
          if (originalMessage && originalMessage.components) {
            const newComponents = originalMessage.components.map((row) => {
              return new ActionRowBuilder().addComponents(
                StringSelectMenuBuilder.from(row.components[0]).setDisabled(
                  true
                )
              );
            });
            await originalMessage
              .edit({ components: newComponents })
              .catch((e) => console.error("Error al deshabilitar el menú:", e));
          }

          discordClient.activeSearches.delete(originalMessage.id);
        } catch (error) {
          console.error(
            "Error al añadir canción a la cola con Kazagumo:",
            error
          );
          await interaction.reply({
            content: "Hubo un error al intentar reproducir la canción.",
            ephemeral: true,
          });
        }
      }
      return;
    }

    // --- MANEJO DE BOTONES (si tienes otros botones) ---
    // Esta verificación SÓLO se ejecutará si la interacción NO fue un comando de barra NI un select menu.
    if (interaction.isButton()) {
      // Agrega tu lógica específica para botones aquí
      // Por ejemplo:
      // if (interaction.customId === 'boton_siguiente_cancion') {
      //     // ...
      // }
      return; // IMPORTANTE: Termina la ejecución después de manejar un botón.
    }

    // Si la ejecución llega aquí, el tipo de interacción no ha sido manejado explícitamente.
    // console.log(`Tipo de interacción no manejado: ${interaction.type}`);
  },
};
