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
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;
    if (itemData.type === "weapon")
    {
      this._prepareWeapon(data);
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
      if (item.data.charges.value <= 0)
      {
        //NO CHARGES
        return ui.notifications.warn(`${this.actor.name} does not have an enough charges for item ${item.name}`);
      }
      else
      {
        item.data.charges.value--;
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

    let roll = new Roll('1d@actiondice.value', actorData);
    let label = `Rolling ${item.name}`;
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }


}
