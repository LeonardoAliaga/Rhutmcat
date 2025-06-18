const { Events } = require("discord.js");
const color = require("ansi-colors");

module.exports = {
  name: Events.ClientReady,
  async execute(c) {
    console.log(
      `${color.cyan(c.user.tag)} está listo en ${color.bgMagenta(
        c.guilds.cache.get("1380534647317991475").name
      )} usando ${color.blue("Discord")}`
    );
  },
};
