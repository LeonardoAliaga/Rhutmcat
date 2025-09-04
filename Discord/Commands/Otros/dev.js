const { SlashCommandBuilder } = require("discord.js");

// ID de tu usuario para restringir el acceso
const ownerId = "728259605565800558"; // ¡Importante! Reemplaza con tu ID de usuario de Discord

module.exports = {
  // Define el comando de barra
  data: new SlashCommandBuilder()
    .setName("dev")
    .setDescription(
      "Ejecuta código interno del bot (solo para desarrolladores)."
    )
    .addStringOption((option) =>
      option
        .setName("codigo")
        .setDescription("El código JavaScript a ejecutar.")
        .setRequired(true)
    ),

  // Lógica del comando
  async execute(interaction, client) {
    // Asegúrate de pasar 'client' si lo necesitas en el eval
    // Solo el propietario del bot puede usar este comando
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "No tienes permiso para usar este comando.",
        ephemeral: true,
      });
    }

    const codeToExecute = interaction.options.getString("codigo");

    try {
      await interaction.deferReply(); // DeferReply antes de la ejecución

      // Ejecutar el código. 'client' y 'interaction' están disponibles en el contexto.
      // Puedes añadir más variables si lo necesitas, por ejemplo, 'guild', 'channel', etc.
      let result = eval(codeToExecute);

      // Si el resultado es una Promise, espera a que se resuelva
      if (result && typeof result.then === "function") {
        result = await result;
      }

      // Formatear la salida para Discord
      let output = `\`\`\`javascript\n${
        result ? String(result) : "Undefined/Null"
      }\n\`\`\``;

      // Limitar la longitud de la respuesta
      if (output.length > 1900) {
        output = output.substring(0, 1900) + "... (output truncated)";
      }

      await interaction.editReply(`**Resultado:**\n${output}`);
    } catch (error) {
      let errorMessage = `\`\`\`javascript\n${error.message}\n\`\`\``;
      if (errorMessage.length > 1900) {
        errorMessage =
          errorMessage.substring(0, 1900) + "... (error message truncated)";
      }
      await interaction.editReply(`**Error:**\n${errorMessage}`);
    }
  },
};
