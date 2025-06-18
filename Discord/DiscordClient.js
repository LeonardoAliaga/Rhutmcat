const Discord = require("discord.js");
require("dotenv").config();

const fs = require("fs");
const { Kazagumo } = require("kazagumo");
const path = require("path");

//Definiendo e iniciando clientes
const discordClient = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
  ],
});

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

// Inicializar Kazagumo
require("./musicManager")(discordClient);

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
// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${discordClient.commands.size} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Discord.Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.SERVER_ID
      ),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

module.exports = discordClient;
