import {parseNPC} from './npc-parser.js';
import {totalccItem} from '../item/item.js';

//Sort function for orde
const sortFunction = (a, b) => a.data.order < b.data.order ? -1 : a.data.order > b.data.order ? 1 : 0;


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class totalccActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["totalcc", "sheet", "actor"],
      template: "systems/totalcc/templates/actor/compactsheet.html",
      width: 800,
      height: 1000,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }


  /** @inheritdoc */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    buttons.unshift(
        {
            label: "Import Stats",
            class: "paste-block",
            icon: "fas fa-paste",
            onclick: ev => this._onPasteStatBlock(ev)
        }//,
      //   {
          //   label: "Clear",
          //   class: "clear-sheet",
      //      icon: "fas fa-eraser",
      //      onclick: ev => this._onClearSheet(ev)
      //  }
    );

    return buttons
  }


  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
 //   data.dtypes = ["String", "Number", "Boolean"];
 //   for (let attr of Object.values(data.data.attributes)) {
 //     attr.isCheckbox = attr.dtype === "Boolean";
 //   }

    // Prepare items.
    if (this.actor.data.type == 'character' || this.actor.data.type == 'npc') {
      this._prepareCharacterItems(data);
    }

    if (this.actor.data.type == 'npc')
    {
      //this.options.template = "systems/totalcc/templates/actor/npc-sheet.html"
      data.data.isNPC = true;
    } else {
      data.data.isNPC = false;
    }

    console.log(data);

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;




    // Initialize containers.
    const gear = [];
    const skills = [];
    const weapons = [];
    const armor = [];
    const activeMutations = [];
    const passiveMutations = [];
    const features = [];
    const mutations = [];
    const spells = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: []
    };

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      }
      //Weapons
      else if (i.type === 'weapon') {
          weapons.push(i);
      }
      //ARMOR
      else if (i.type === 'armor') {
          armor.push(i);
      }
      //MUTATIONS
      else if (i.type === 'mutation') {
        if (i.data.ispassive)
        {
          passiveMutations.push(i);
        }
        else
        {
          activeMutations.push(i);
        }
      }
      //Skills
      else if (i.type === 'skill') {
         skills.push(i);
      }
    }

    weapons.sort(sortFunction);


    // Assign and return
    actorData.gear = gear;
    actorData.skills = skills;
    actorData.features = features;
    actorData.spells = spells;
    actorData.weapons = weapons;
    actorData.armor = armor;
    actorData.activeMutations = activeMutations;
    actorData.passiveMutations = passiveMutations;
    actorData.mutations = mutations;
  }


  async _onQtChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.getOwnedItem(itemId);
    return item.update({ "data.quantity.value": parseInt(event.target.value) });
  }

  async _onChargeChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.getOwnedItem(itemId);
    return item.update({ "data.charges.value": parseInt(event.target.value) });
  }

  async _onExpendedChange(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.getOwnedItem(itemId);
    return item.update({ "data.expended": event.target.checked });
  }


  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.item .rollable').click(this._onRollItem.bind(this));

    html
    .find(".quantity input")
    .click((ev) => ev.target.select())
    .change(this._onQtChange.bind(this));

    html
    .find(".expended")
    .click((ev) => ev.target.select())
    .change(this._onExpendedChange.bind(this));

    html
    .find(".item-charges input")
    .click((ev) => ev.target.select())
    .change(this._onChargeChange.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragItemStart(ev);
      html.find('h4.item-name').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRollItem(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    const itemId = event.target.closest(".item").dataset.itemId;
    if (!itemId)
      return;
    const item = this.actor.getOwnedItem(itemId);

    item.roll();
    this.render();


  }











     /**
     * Prompt for a stat block to import
     * @param {Event} event   The originating click event
     * @private
     */
    _onPasteStatBlock(event) {
      event.preventDefault();
      const html = `<form id="stat-block-form">
          <textarea name="statblock"></textarea>
      </form>`;
      new Dialog({
          title: game.i18n.localize("DCC.PasteBlock"),
          content: html,
          buttons: {
              yes: {
                  icon: '<i class="fas fa-check"></i>',
                  label: "Import Stats",
                  callback: html => this._pasteStateBlock(html)
              },
              no: {
                  icon: '<i class="fas fa-times"></i>',
                  label: "Cancel"
              }
          }
      }).render(true);
  }

  /**
   * Import a stat block
   * @param {string} statBlockHTML   The stat block to import
   * @private
   */
  _pasteStateBlock(statBlockHTML) {
      const statBlock = statBlockHTML[0].querySelector("#stat-block-form")[0].value;
      const parsedNPC = parseNPC(statBlock);
      console.log(this.object.data.data);


      parsedNPC.Weapons.forEach(wepvalue => 
        {
          const type = "weapon";
          const name = `New ${type.capitalize()}`;
          // Prepare the item object.
          let data = 
          {
            "weaponstats" : 
            {
              "range" : "Melee",
              "damage" : "1d6",
              "type" : "",
              "attack" : 0
            }
          };
          data.weaponstats.ranged = wepvalue.ranged;
          data.weaponstats.type = wepvalue.special;
          data.weaponstats.attack = wepvalue.toHit;
          data.weaponstats.damage = wepvalue.damage;
          const itemData = {
            name: wepvalue.name,
            type: type,
            data: data
          };
          // Remove the type from the dataset since it's in the itemData.type prop.
          delete itemData.data["type"];
          // Finally, create the item!
          this.actor.createOwnedItem(itemData);
        });




      Object.entries(parsedNPC).forEach(([key, value]) => {
          console.log(key + ' ' + value);
          if (key !== "Weapons")
          {
            if (this.form[key]) this.form[key].value = value;

            //this.actor.data.data.key
          }
      });

      this.actor.update(parsedNPC);



  }




  spawnTabControls() {
    // HERE WE NEED TO SPECIFY OUR TAB GROUPS
    //if (!this.bTabControlsActive) {
      
      //this.bTabControlsActive = true;
    //}
  }



}
