require("dotenv").config();

const discordClient = require("./Discord/DiscordClient");

discordClient.login(process.env.TOKEN);
