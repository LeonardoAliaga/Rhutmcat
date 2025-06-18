const { Events } = require("discord.js");
const color = require("ansi-colors");

module.exports = {
  name: "playerStart",
  once: false, // 👈 ¡Esta línea es importante!
  async execute(player, track, c) {
    console.log(
      `Now playing ${color.bgMagenta(track.title)} by ${color.blue(
        track.author
      )}`
    );
  },
};
