import {DCC} from '../config.js';

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class totalccActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const Chardata = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
   // for (let [key, ability] of Object.entries(data.abilities)) {
      // Calculate the modifier using d20 rules.
   //   ability.mod = Math.floor((ability.value - 10) / 2);
   // }

    // Ability modifiers
    for (let [id, abl] of Object.entries(data.abilities)) {
      abl.mod = DCC.abilities.modifiers[abl.value] || 0;
    }

  }





      /**
     * Roll a Weapon Attack
     * @param {string} weaponId     The weapon id (e.g. "m1", "r1")
     * @param {Object} options      Options which configure how ability tests are rolled
     */
    async rollWeaponAttack(weaponId, options = {}) {
      const weapon = this.getOwnedItem(weaponId);
      const speaker = {alias: this.name, _id: this._id};
      const CharData = this.data.data;
      const WeaponData = weapon.data.data;
      let LuckMod = 0;

      let AbilityMod = 0;
      let DamageFormula = `${WeaponData.weaponstats.damage}`;
      if (this.data.type === "character")
      {
        LuckMod = CharData.abilities.luck.mod;

        if (WeaponData.ismelee)
        {
          AbilityMod = CharData.abilities.strength.mod;
          DamageFormula = `${WeaponData.weaponstats.damage} + ${AbilityMod}`
        }
        else
        {
          AbilityMod = CharData.abilities.agility.mod;
        }
    }


      let formula = `1d${CharData.attributes.actiondice.value} + ${AbilityMod} + ${WeaponData.weaponstats.attack}`

      //ADD ATTACK MOD
      if (CharData.attributes.attack.value !== "")
      {
        formula += ` + ${CharData.attributes.attack.value}`;
      }

      /* Roll the Attack */
      let roll = new Roll(formula, {'critical': 20});
      roll.roll();
      const rollHTML = this._formatRoll(roll, formula);



      /** Handle Critical Hits **/
      let crit = "";
      if (Number(roll.dice[0].results[0]) === CharData.attributes.actiondice.value) {
          const critTableFilter = `Crit Table ${CharData.attributes.crittable.value}`;
          const pack = game.packs.get('totalcc.criticalhits');
          await pack.getIndex(); //Load the compendium index
          let entry = pack.index.find(entity => entity.name.startsWith(critTableFilter));
          const table = await pack.getEntity(entry._id);
          const roll = new Roll(`${CharData.attributes.critdice.value} + ${LuckMod}`);
          const critResult = await table.draw({'roll': roll, 'displayChat': false});
          crit = ` <br><br><span style="color:green; font-weight: bolder">Critical Hit!</span> ${critResult.results[0].text}</span>`;
      }

      /** Handle Fumbles **/
      let fumble = "";
      let fumbleDie = "1d4";
      
      if (Number(roll.dice[0].results[0]) === 1) {
          const pack = game.packs.get('totalcc.fumbles');
          await pack.getIndex(); //Load the compendium index
          let entry = pack.index.find(entity => entity.name.startsWith("Fumble"));
          const table = await pack.getEntity(entry._id);
          const roll = new Roll(`${fumbleDie} - ${LuckMod}`);
          const fumbleResult = await table.draw({'roll': roll, 'displayChat': false});
          fumble = ` <br><br><span style="color:red; font-weight: bolder">Fumble!</span> ${fumbleResult.results[0].text}</span>`;
      }

      /* Emote attack results */
      const messageData = {
          user: game.user._id,
          speaker: speaker,
          type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
          content: `Attacks with their ${game.i18n.localize(weapon.name)} and hits AC ${rollHTML} for [[${DamageFormula}]] points of ${WeaponData.weaponstats.type} damage!${crit}${fumble}`,
          sound: CONFIG.sounds.dice
      };
      CONFIG.ChatMessage.entityClass.create(messageData);
  }

  /**
   * Format a roll for display in-line
   * @param {Object<Roll>} roll   The roll to format
   * @param {string} formula      Formula to show when hovering
   * @return {string}             Formatted HTML containing roll
   */
  _formatRoll(roll, formula) {
      const rollData = escape(JSON.stringify(roll));

      // Check for Crit/Fumble
      let critFailClass = "";
      if (Number(roll.dice[0].results[0]) === 20) critFailClass = "critical ";
      else if (Number(roll.dice[0].results[0]) === 1) critFailClass = "fumble ";

      return `<a class="${critFailClass}inline-roll inline-result" data-roll="${rollData}" title="${formula}"><i class="fas fa-dice-d20"></i> ${roll.total}</a>`;
  }



  
      /**
     * Roll a SKILL
     * @param {string} skillID     The weapon id (e.g. "m1", "r1")
     * @param {Object} options      Options which configure how ability tests are rolled
     */
    async rollSkill(skillID, options = {}) {
      const skill = this.getOwnedItem(skillID);
      const speaker = {alias: this.name, _id: this._id};
      const CharData = this.data.data;
      const SkillData = skill.data.data;


      let AbilityMod;
      if (SkillData.abilitiesmodifyer !== "" || SkillData.abilitiesmodifyer !== "None" || SkillData.abilitiesmodifyer !== "none")
      {
      AbilityMod = ` + @CharData.abilities.${SkillData.abilitiesmodifyer}.mod`;
      }

      let formula = `1d${CharData.attributes.actiondice.value} ${AbilityMod} + ${SkillData.bonus}`;

      if (SkillData.additionalmod != "")
      {
        formula += `+ ${SkillData.additionalmod}`;
      }

      /* Roll the SKILL */
      let roll = new Roll(formula, {CharData, SkillData});
      //roll.roll();

      let label = `Rolling skill ${skill.name}`;


      this.rollFromTable(skill, roll, label);

    }


    async rollMutation(skillID, options = {}) {
      const Mutation = this.getOwnedItem(skillID);
      const speaker = {alias: this.name, _id: this._id};
      const CharData = this.data.data;
      const MutationData = Mutation.data.data;

      let formula = `1d${CharData.attributes.actiondice.value}`
      if (this.data.type === "character")
      {
        formula += ` + ${CharData.level.value}`;
      }

      /* Roll the MUTATION */
      let roll = new Roll(formula, {CharData, MutationData});
      //roll.roll();

      let label = `Rolling MUTATION: ${Mutation.name}`;

      this.rollFromTable(Mutation, roll, label);


    }

    
    async rollSpell(SpellID, options = {}) {
      const Spell = this.getOwnedItem(SpellID);
      const speaker = {alias: this.name, _id: this._id};
      const CharData = this.data.data;
      const SpellData = Spell.data.data;

      let formula = `1d${CharData.attributes.actiondice.value}`
      if (this.data.type === "character")
      {
        formula += ` + ${CharData.level.value}`;
        if (SpellData.casterability !== "")
        {
          const AbilityMod = `@CharData.abilities.${SpellData.casterability}.mod`;
          formula += ` + ${AbilityMod}`;
        }
      }


      /* Roll the SPELL */
      let roll = new Roll(formula, {CharData, SpellData});
      //roll.roll();

      let label = `Rolling spell: ${Spell.name}`;

      this.rollFromTable(Spell, roll, label);

    }

    async rollFromTable(ItemData, roll, label) {
      let entry;
      let table;

      
      const Packname = `totalcc.${ItemData.data.data.usetable}`;
      const pack = game.packs.get(Packname);
      if (pack)
      {
      await pack.getIndex(); //Load the compendium index
      entry = pack.index.find(entity => entity.name.startsWith(ItemData.name));
      }

      if (entry)
      {
        table = await pack.getEntity(entry._id);
      }
      else
      {
        table = game.tables.find(entity => entity.name.startsWith(ItemData.name));
      }

      if (!table)
      {
        roll.roll().toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });
        return;
      }

      if (!roll._rolled)
      {
        roll.roll();
      }
      const tableresult = await table.draw({'roll': roll, 'displayChat': true});

    }


}


