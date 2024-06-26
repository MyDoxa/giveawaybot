const Discord = require("discord.js");
const client = new Discord.Client({ intents: 7753 });
module.exports = client;
const fs = require("fs");
const colors = require("colors");
const config = require("./config.json");
client.config = config;

// Create the model
const giveawayModel = require("./schema/giveaway");

const { GiveawaysManager } = require("discord-giveaways");
const GiveawayManagerWithOwnDatabase = class extends GiveawaysManager {
  // This function is called when the manager needs to get all giveaways which are stored in the database.
  async getAllGiveaways() {
    // Get all giveaways from the database. We fetch all documents by passing an empty condition.
    return await giveawayModel.find().lean().exec();
  }

  // This function is called when a giveaway needs to be saved in the database.
  async saveGiveaway(messageId, giveawayData) {
    // Add the new giveaway to the database
    await giveawayModel.create(giveawayData);
    // Don't forget to return something!
    return true;
  }

  // This function is called when a giveaway needs to be edited in the database.
  async editGiveaway(messageId, giveawayData) {
    // Find by messageId and update it
    await giveawayModel.updateOne({ messageId }, giveawayData).exec();
    // Don't forget to return something!
    return true;
  }

  // This function is called when a giveaway needs to be deleted from the database.
  async deleteGiveaway(messageId) {
    // Find by messageId and delete it
    await giveawayModel.deleteOne({ messageId }).exec();
    // Don't forget to return something!
    return true;
  }
};

// Create a new instance of your new class
const manager = new GiveawayManagerWithOwnDatabase(
  client,
  {
    default: {
      botsCanWin: false,
      embedColor: "RANDOM",
      reaction: "🎉",
      lastChance: {
        enabled: true,
        content: `🛑 **Last chance to enter** 🛑`,
        threshold: 10000,
        embedColor: "#FF0000",
      },
    },
  },
  false
); // ATTENTION: Add "false" in order to not start the manager until the DB got checked, see below
// We now have a giveawaysManager property to access the manager everywhere!
client.giveawaysManager = manager;

fs.readdir("./events/discord", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/discord/${file}`);
    let eventName = file.split(".")[0];
    console.log(colors.blue(`[Event]   ✅  Loaded: ${eventName}`));
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/discord/${file}`)];
  });
});

fs.readdir("./events/giveaways", (_err, files) => {
  client.giveawaysManager._init();
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/giveaways/${file}`);
    let eventName = file.split(".")[0];
    console.log(colors.blue(`[Event]   🎉 Loaded: ${eventName}`));
    client.giveawaysManager.on(eventName, (...file) =>
      event.execute(...file, client)
    ),
      delete require.cache[require.resolve(`./events/giveaways/${file}`)];
  });
});

// let interactions be a new collection (slash commands)
client.interactions = new Discord.Collection();
// creating an empty array for registering slash commands
client.register_arr = [];
/* Load all slash commands */
fs.readdir("./slash/", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    let props = require(`./slash/${file}`);
    let commandName = file.split(".")[0];
    client.interactions.set(commandName, {
      name: commandName,
      ...props,
    });
    client.register_arr.push(props);
  });
});

// Let commands be a new collection (message commands)
client.commands = new Discord.Collection();
/* Load all commands */
fs.readdir("./commands/", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    let props = require(`./commands/${file}`);
    let commandName = file.split(".")[0];
    client.commands.set(commandName, {
      name: commandName,
      ...props,
    });
  });
});

client.login(config.TOKEN);

// Uncomment the following lines to prevent the bot from crashing when an error occurs
// WARNING: This will make debugging more difficult
/*
// #1
process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at: " + promise);
  console.log("Reason: " + reason);
});

// #2
process.on("uncaughtException", (err, origin) => {
  console.log("Caught exception: " + err);
  console.log("Origin: " + origin);
});

// #3
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log(err);
  console.log("Origin: " + origin);
});

// #4
process.on("multipleResolves", (type, promise, reason) => {
  console.log(type, promise, reason);
});
*/
