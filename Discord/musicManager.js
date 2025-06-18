const { Connectors } = require("shoukaku");
const { Kazagumo, Plugins } = require("kazagumo");
// const discordClient = require("./DiscordClient");
// require("./DiscordClient");

const node = [
  {
    name: "pruebaxd",
    url: "lavalink-v2.pericsq.ro:443",
    auth: "wwweasycodero",
    secure: true,
  },
];

module.exports = (discordClient) => {
  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: "youtube",
      plugins: [new Plugins.PlayerMoved(discordClient)],
      send: (guildId, payload) => {
        const guild = discordClient.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
    },
    new Connectors.DiscordJS(discordClient),
    node
  );

  kazagumo.shoukaku.on("ready", (name) =>
    console.log(`Lavalink ${name}: Ready!`)
  );
  kazagumo.shoukaku.on("error", (name, error) =>
    console.error(`Lavalink ${name}: Error Caught,`, error)
  );
  kazagumo.shoukaku.on("close", (name, code, reason) =>
    console.warn(
      `Lavalink ${name}: Closed, Code ${code}, Reason ${reason || "No reason"}`
    )
  );
  kazagumo.shoukaku.on("debug", (name, info) =>
    console.debug(`Lavalink ${name}: Debug,`, info)
  );
  kazagumo.shoukaku.on("disconnect", (name, count) => {
    const players = [...kazagumo.shoukaku.players.values()].filter(
      (p) => p.node.name === name
    );
    players.map((player) => {
      kazagumo.destroyPlayer(player.guildId);
      player.destroy();
    });
    console.warn(`Lavalink ${name}: Disconnected`);
  });
  discordClient.kazagumo = kazagumo;
};
