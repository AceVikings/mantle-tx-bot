const { SlashCommandBuilder } = require("discord.js");
const { ethers } = require("ethers");

let watchedFilters = [];
const watchMap = new Map();
module.exports = {
  data: new SlashCommandBuilder()
    .setName("watch-event")
    .setDescription("Watches a contract for events")
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription("Address to watch")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("event")
        .setDescription("Event signature for the event to watch")
        .setRequired(true)
    ),
  async execute(interaction) {
    let address = interaction.options.getString("address");
    let event = interaction.options.getString("event");
    filter = {
      address: address,
      topics: [
        // the name of the event, parnetheses containing the data type of each event, no spaces
        ethers.utils.id(event),
      ],
    };
    watchedFilters.push(filter);
    if (watchMap.has(filter)) {
      let users = watchMap.get(filter);
      users.push(interaction.user);
      watchMap.set(users);
    } else {
      watchAddressEvent(filter);
      watchMap.set(filter, [interaction.user]);
    }
    await interaction.reply({
      content: `Watching ${address}`,
      ephemeral: true,
    });
  },
};
async function watchAddressEvent(filter) {
  const provider = new ethers.providers.WebSocketProvider(process.env.WSS);
  provider.on(filter, async (tx) => {
    let users = watchMap.get(filter);
    for (var i = 0; i < users.length; i++) {
      await users[i].send(
        `Event emission match with tx hash: ${tx.transactionHash}`
      );
    }
  });
}
