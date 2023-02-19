const { SlashCommandBuilder } = require("discord.js");
const { ethers } = require("ethers");

let watchedAddresses = [];
const watchMap = new Map();
module.exports = {
  data: new SlashCommandBuilder()
    .setName("watch-volume")
    .setDescription("Watches an address for transactions")
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription("Address to watch")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Min amount of bit to alert")
        .setRequired(true)
    ),
  async execute(interaction) {
    let address = interaction.options.getString("address");
    let amount = interaction.options.getInteger("amount");
    watchedAddresses.push(address);
    if (watchMap.has(address)) {
      let users = watchMap.get(address);
      users.push({ user: interaction.user, value: amount });
      watchMap.set(users);
    } else {
      watchMap.set(address, [{ user: interaction.user, value: amount }]);
    }
    await interaction.reply({
      content: `Watching ${address}`,
      ephemeral: true,
    });
  },
};

watchAddressVolume();

async function watchAddressVolume() {
  const provider = new ethers.providers.WebSocketProvider(process.env.WSS);

  provider.on("block", async (n) => {
    let tx = (await provider.getBlockWithTransactions(n)).transactions;
    for (var i = 0; i < tx.length; i++) {
      if (watchedAddresses.includes(tx[i].from)) {
        let users = watchMap.get(tx[i].from);
        for (var j = 0; j < users.length; j++) {
          if (users[j].value < ethers.utils.formatEther(tx[i].value)) {
            await users[j].user.send(
              `Transaction match with tx hash: ${tx[i].hash} for 'from' address ${tx[i].from}`
            );
          }
        }
      }
      if (watchedAddresses.includes(tx[i].to)) {
        let users = watchMap.get(tx[i].to);
        for (var j = 0; j < users.length; j++) {
          if (users[j].value < ethers.utils.formatEther(tx[i].value)) {
            await users[j].user.send(
              `Transaction match with tx hash: ${tx[i].hash} for 'to' address ${tx[i].to}`
            );
          }
        }
      }
    }
  });
}
