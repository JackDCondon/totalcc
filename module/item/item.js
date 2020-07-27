import {DCC} from '../config.js';

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
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;





    if (item.data.charges.usescharges)
    {
      if ((item.data.charges.value - itemData.charges.cost) < 0)
      {
        //NO CHARGES
        return ui.notifications.warn(`${this.actor.name} does not have an enough charges [${itemData.charges.cost}] for item ${item.name}`);
      }
      else
      {
        item.data.charges.value-=itemData.charges.cost;
        //item.update();
        this.update(item);
        //update({ "data.quantity.value": parseInt(event.target.value) });
      }
    }




    if (item.type === "weapon")
    {
      this.actor.rollWeaponAttack(item._id);
      return;

    }

    if (item.type === "skill")
    {
      this.actor.rollSkill(item._id);
      return;

    }

    if (item.type === "mutation")
    {
      this.actor.rollMutation(item._id);
      return;

    }

    if (item.type === "spell")
    {
      this.actor.rollSpell(item._id);
      return;
    }

    this.actor.rollItem(item._id);


  }


    /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async rollArtifact() 
  {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    if (!actorData) return;

    this.actor.rollArtifactOnItem(item._id);

  }


}
