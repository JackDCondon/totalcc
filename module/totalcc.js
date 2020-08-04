// Import Modules
import { totalccActor } from "./actor/actor.js";
import { totalccActorSheet } from "./actor/actor-sheet.js";
import { totalccItem } from "./item/item.js";
import { totalccItemSheet } from "./item/item-sheet.js";
import { preloadHandlebarsTemplates } from "./preloadTemplates.js";
import {DCC} from './config.js';
import {MCC} from './config.js';

Hooks.once('init', async function() {

  CONFIG.DCC = DCC;
  CONFIG.MCC = MCC;

  game.totalcc = {
    totalccActor,
    totalccItem,
    rollItemMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20 + @attributes.init.value",
    decimals: 0
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = totalccActor;
  CONFIG.Item.entityClass = totalccItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("totalcc", totalccActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("totalcc", totalccItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
  });

  Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
  });

  await preloadHandlebarsTemplates();

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createtotalccMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createtotalccMacro(data, slot) {

  let item;
  let command;
  let macroName;

  if (data.type === "Item") 
  {
    item = data.data;
    command = `game.totalcc.rollItemMacro("${item.name}");`;
    macroName = item.name;
  }
  
  if (data.type === "MFItem")
  {
    item = data.data.itemdata;
    command = `game.totalcc.rollItemMacro("${item.name}", "${data.data.mfid}");`;
    macroName = `${item.name}: ${data.data.mfid}`;
  }
  
  
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");


  // Create the macro command

  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: macroName,
      type: "script",
      img: item.img,
      command: command,
      flags: { "totalcc.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName, MFItemName = "") {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);


  let options = {};
  if (MFItemName != "")
  {
    const mfItem = item.data.data.multifunctional.weapons.find(i => i.name === MFItemName);
    if (mfItem)
    {
      options.mfID = mfItem._id;
    }

  }

  // Trigger the item roll
  return item.roll(options);
}