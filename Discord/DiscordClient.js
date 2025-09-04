const { Routes } = require("discord.js");
const Discord = require("discord.js");
require("dotenv").config();

const fs = require("fs");
const { Kazagumo } = require("kazagumo");
const path = require("path");

const discordClient = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
  ],
});

discordClient.utils = {
  /**
   * Formatea una duración en milisegundos a un formato MM:SS.
   * @param {number} ms - Duración en milisegundos.
   * @returns {string} Duración formateada (MM:SS).
   */
  formatDuration: (ms) => {
    if (isNaN(ms) || ms < 0) return "00:00"; // Manejar casos inválidos

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(String(days).padStart(2, "0"));
    if (hours > 0 || days > 0) parts.push(String(hours).padStart(2, "0")); // Include hours if any, or if there are days
    parts.push(String(minutes).padStart(2, "0"));
    parts.push(String(seconds).padStart(2, "0"));

    // Si hay horas o días, el formato será HH:MM:SS o DD:HH:MM:SS
    if (hours > 0 || days > 0) {
      return `${String(hours + days * 24).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    // De lo contrario, MM:SS
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  },
};

// Inicializar Kazagumo
require("./musicManager")(discordClient);

//Command Handler
discordClient.commands = new Discord.Collection();
const foldersPath = path.join(__dirname, "Commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      discordClient.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Cargar eventos generales
const clientEventsPath = path.join(__dirname, "Events", "Client");
const clientEventFiles = fs
  .readdirSync(clientEventsPath)
  .filter((f) => f.endsWith(".js"));

for (const file of clientEventFiles) {
  const event = require(path.join(clientEventsPath, file));
  if (event.once) {
    discordClient.once(event.name, (...args) =>
      event.execute(...args, discordClient)
    );
  } else {
    discordClient.on(event.name, (...args) =>
      event.execute(...args, discordClient)
    );
  }
}

// Cargar eventos musicales (Kazagumo)
const musicEventsPath = path.join(__dirname, "Events", "Music");
const musicEventFiles = fs
  .readdirSync(musicEventsPath)
  .filter((f) => f.endsWith(".js"));

for (const file of musicEventFiles) {
  const event = require(path.join(musicEventsPath, file));
  if (!event || typeof event.execute !== "function") continue;

  if (event.once) {
    discordClient.kazagumo.once(event.name, (...args) =>
      event.execute(...args, discordClient)
    );
  } else {
    discordClient.kazagumo.on(event.name, (...args) =>
      event.execute(...args, discordClient)
    );
  }
}

// Construct and prepare an instance of the REST module
const rest = new Discord.REST().setToken(process.env.TOKEN);
// console.log(client.commands.data)

const commands = discordClient.commands.map((command) => command.data.toJSON());

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");

    // Mostrar tabla de comandos y subcomandos registrados
    const chalk = require("chalk").default;
    console.log(chalk.bold.green("\n📋 Comandos Slash Registrados\n"));

    const table = [];

    for (const [name, command] of discordClient.commands) {
      const data = command.data?.toJSON?.();

      if (!data) continue;

      // Verifica si tiene subcomandos
      const subcommands = data.options?.filter((opt) => opt.type === 1); // type 1 = SUB_COMMAND

      if (subcommands && subcommands.length > 0) {
        for (const sub of subcommands) {
          table.push({ Comando: `✅ /${data.name} ${sub.name}` });
        }
      } else {
        table.push({ Comando: `✅ /${data.name}` });
      }
    }

    console.table(table);
    console.log(
      chalk.yellow(`\nTotal: ${table.length} comandos registrados\n`)
    );
  } catch (error) {
    console.error(error);
  }
})();

module.exports = discordClient;
