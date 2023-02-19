const { SlashCommandBuilder } = require("discord.js");
const { ethers } = require("ethers");

let watchedAddresses = [];
const watchMap = new Map();
module.exports = {
  data: new SlashCommandBuilder()
    .setName("watch")
    .setDescription("Watches an address for transactions")
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription("Address to watch")
        .setRequired(true)
    ),
  async execute(interaction) {
    let address = interaction.options.getString("address");
    watchedAddresses.push(address);
    if (watchMap.has(address)) {
      let users = watchMap.get(address);
      users.push(interaction.user);
      watchMap.set(users);
    } else {
      watchMap.set(address, [interaction.user]);
    }
    await interaction.reply({
      content: `Watching ${address}`,
      ephemeral: true,
    });
  },
};

watchAddress();

async function watchAddress() {
  const provider = new ethers.providers.WebSocketProvider(process.env.WSS);

  provider.on("block", async (n) => {
    let tx = (await provider.getBlockWithTransactions(n)).transactions;
    for (var i = 0; i < tx.length; i++) {
      if (watchedAddresses.includes(tx[i].from)) {
        let users = watchMap.get(tx[i].from);
        for (var j = 0; j < users.length; j++) {
          await users[j].send(
            `Transaction match with tx hash: ${tx[i].hash} for 'from' address ${tx[i].from}`
          );
        }
      }
      if (watchedAddresses.includes(tx[i].to)) {
        let users = watchMap.get(tx[i].to);
        for (var j = 0; j < users.length; j++) {
          await users[j].send(
            `Transaction match with tx hash: ${tx[i].hash} for 'to' address ${tx[i].to}`
          );
        }
      }
    }
  });
}
