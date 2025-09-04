const { Events } = require("discord.js");
const color = require("ansi-colors");

module.exports = {
  name: "queueUpdate",
  once: false, // 👈 ¡Esta línea es importante!
  async execute(player, queue) {
    // console.log(queue);
    // console.log(
    //   `Now playing ${color.bgMagenta(track.title)} by ${color.blue(
    //     track.author
    //   )}`
    // );
  },
};
