import {DCC} from '../config.js';
import {MultiuseWep} from '../item/multiuse.js';


/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class totalccItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const item = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const itemdata = item.data;

    if (item.type === "weapon")
    {
      this._prepareWeapon(itemdata);
    }

    if (!itemdata.charges.cost)
    {
      itemdata.charges.cost = 1;
    }



    itemdata.canbeartifact = (item.type === "item" || item.type === "armor" || item.type === "weapon")
    itemdata.isspellbase = (item.type === "mutation" || item.type === "spell");

    if (item.type === "mutation")
    {
      itemdata.ispassive = (itemdata.mutationuse === "passive");
    }

  }


  _prepareWeapon(data) {
  data.ismelee = (this.data.data.weaponstats.range === "Melee");
  }



  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(options = {}) {
    // Basic template rendering data
    const token = this.actor.token ? this.actor.token : {};
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    const chargesleft = item.data.charges.value;
    let chargescost = item.data.charges.cost;
    let mfwep;
    let ItemType = item.type;


    if (options.mfID)
    {
      mfwep = this.HasMultifuncWep(options.mfID);
      if (mfwep)
      {
        chargescost = mfwep.data.charges.cost;
        ItemType = mfwep.type;
      }
    }


    let DidRoll = true;

    if (ItemType === "weapon")
    {
      DidRoll = await this.actor.rollWeaponAttack(item._id, options);
    } else if (ItemType === "skill")
    {
      DidRoll = await this.actor.rollSkill(item._id, options);
    } else if (ItemType === "mutation")
    {
      DidRoll = await this.actor.rollMutation(item._id, options);
    } else if (ItemType === "spell")
    {
      DidRoll = await this.actor.rollSpell(item._id, options);
    } else 
    {
      DidRoll = await this.actor.rollItem(item._id, options);
    }


    if (item.data.charges.usescharges && DidRoll)
    {
      if ((chargesleft - chargescost) < 0)
      {
        //NO CHARGES
        return ui.notifications.warn(`${this.actor.name} does not have an enough charges [${itemData.charges.cost}] for item ${item.name}`);
      }
      else
      {
        item.data.charges.value-=chargescost;
        //item.update();
        this.update(item);
        //update({ "data.quantity.value": parseInt(event.target.value) });
      }
    }
  }




    /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async rollArtifact() 
  {
    // Basic template rendering data
    //const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    if (!actorData) return;

    this.actor.rollArtifactOnItem(item._id);
  }


      /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async CreateMultifuncWep() 
  {
    // Basic template rendering data
    //const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;
    const WepArray = itemData.multifunctional.weapons;


    let Item = CONFIG.Item.entityClass;
    let NewMFWep = new MultiuseWep();

        // Get the type of item to create.
        const type = "weapon";
        // Grab any data associated with this control.
        const data = {};
        // Initialize a default name.
        const name = `New Function`;

        const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        // Prepare the item object.
        const newitemData = {
          name: name,
          type: type,
          _id: id
        };




    //const NewWepItem = await Item.create(newitemData, {temporary: true, renderSheet: true});
    //NewWepItem.sheet.render();
    //let classwep = new Item(newitemData);
    //NewWepItem.data.mfID = id;


    //NewWepItem._id = id;
    //new
    WepArray.push(NewMFWep);


    //this.update({ 'data' : item });

    let updateData = duplicate(this.data);
    this.update(updateData);
  }




  HasMultifuncWep(MultiFunID) 
  {
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;
    const WepArray = itemData.multifunctional.weapons;

    const FoundItem = WepArray.filter(elem => elem._id === MultiFunID)[0];
    return FoundItem;

  }


  FindMultiFuncWepKey(MultiFunID) 
  {
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;
    const WepArray = itemData.multifunctional.weapons;

    const FoundID = WepArray.findIndex((elem => elem._id === MultiFunID));
    return FoundID;

  }


  async RemoveMultifuncWep(MultiFunID) 
  {
    // Basic template rendering data
    //const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;
    const WepArray = itemData.multifunctional.weapons;

    if (!this.HasMultifuncWep(MultiFunID))
    {
      return;
    }

    const FoundID = WepArray.findIndex((elem => elem._id === MultiFunID));

    if (FoundID < 0)
    {
      return;
    }
    WepArray.splice(FoundID, 1);

    let updateData = duplicate(this.data);
    this.update(updateData);


  }


}
