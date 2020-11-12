import {DCC} from '../config.js';
import {MCC} from '../config.js';

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

    Chardata.isnpc = (actorData.type === 'npc');

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;
    // Calc final abilities
    for (let [id, abl] of Object.entries(data.abilities))
    {
      abl.final = abl.value || 0;
    }
    // Ability modifiers
    for (let [id, abl] of Object.entries(data.abilities))
    {
      abl.mod = DCC.abilitiesmodifiers[abl.final] || 0;
    }
    //SET TECH LEVEL
    data.abilities.intelligence.tl = CONFIG.MCC.TechLevel[data.abilities.intelligence.value] || 0;


    //SET AC
    data.attributes.ac.value = this.CalculateAC();

  }



     /**
     * Get AC from Armor
     */
    CalculateAC() {
      let acout = 10 + this.data.data.abilities.agility.mod;
      this.data.items.forEach(function(item)
      {
        if (item.type === "armor" && item.data.iswearing)
        {
          acout+=item.data.acbonus;
        }

      });
      return acout + this.data.data.attributes.ac.mod;
    }


      /**
     * Get Armor Penetly from armor
     */
    CalculateArmorPenelty() {
      let AP = 0;
      this.data.items.forEach(function(item)
      {
        if (item.type === "armor" && item.data.iswearing)
        {
          AP+=item.data.penalty;
        }

      });
      return AP;
    }



        /**
     * Get Fumble Dice
     */
    GetFumbleDice() {
      let fumbleout = "1d4";
      this.data.items.forEach(function(item)
      {

        if (item.type === "armor" && item.data.iswearing)
        {
          const FumbleDice = item.data.fumble;
          const OldFumbleMax = Roll.maximize(fumbleout)._total;
          let MaxNum =  Roll.maximize(FumbleDice)._total;
          if (MaxNum > OldFumbleMax)
          {
            fumbleout = item.data.fumble;
          }
        }

      });
      this.data.data.attributes.fumble.value = fumbleout;
      return fumbleout;
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
      let WeaponData = weapon.data.data;
      let WeaponStats = WeaponData.weaponstats;
      let LuckMod = 0;

      let AbilityMod = 0;
      let mfwep;

      let AddedData = {};


      if (options.mfID)
      {
        mfwep = weapon.HasMultifuncWep(options.mfID);
        if (mfwep)
        {
          WeaponStats = mfwep.data.weaponstats;
          WeaponData = mfwep.data;
          AddedData.UsesFunction = `Used ${mfwep.name}`;
        }
      }

      if (WeaponData.activation.useactivationtext)
      {
      AddedData.SpecialText = WeaponData.activation.activationtext;
      }

      let formula = this.GetItemActionDice(WeaponData); //TODO

      let DamageFormula = `${WeaponStats.damage}`;


      if (this.data.type === "character")
      {
        LuckMod = CharData.abilities.luck.mod;

        if (WeaponData.ismelee) //TODO
        {
          if (CharData.attributes.attack.value !== "")
          {
            formula += ` + ${CharData.attributes.attack.value}`;
          }
          AbilityMod = CharData.abilities.strength.mod;
          DamageFormula = `${WeaponStats.damage} + ${AbilityMod}`
        }
        else
        {
          if (CharData.attributes.ranged.value !== "")
          {
            formula += ` + ${CharData.attributes.ranged.value}`;
          }
          AbilityMod = CharData.abilities.agility.mod;
        }
      }

      formula += ` + ${AbilityMod} + ${WeaponStats.attack}`




      /* Roll the Attack */

      // let roll = new Roll(formula, {});
      let diceRoll = new Roll(formula);
      //diceRoll.evaluate();
      diceRoll = await this.rolldice(diceRoll);
      if (!WeaponData.dontrolldamage)
      {
        if (!this.hasPlayerOwner)
        {
          AddedData.hittext = `And scores <b>[[${DamageFormula}]]</b> ${WeaponStats.type} Damage`;
        }
        else
        {
          AddedData.hittext = `If you hit, roll <b>${DamageFormula}</b> ${WeaponStats.type} Damage.`;
        }
      }

      let FirstDiceRoll = Number(diceRoll.dice[0].total);


      if (FirstDiceRoll == diceRoll.dice[0].faces) {
          const critTableFilter = `Crit Table ${CharData.attributes.crittable.value}`;
          const pack = game.packs.get('totalcc.criticalhits');
          await pack.getIndex(); //Load the compendium index
          let entry = pack.index.find(entity => entity.name.startsWith(critTableFilter));
          const table = await pack.getEntity(entry._id);
          const CritTableRoll = new Roll(`${CharData.attributes.critdice.value} + ${LuckMod}`);
          const critResult = await table.draw({'roll': CritTableRoll, 'displayChat': false});
          let crit = `<span style="color:green; font-weight: bolder">Critical Hit!</span> ${critResult.results[0].text}</span>`;
          AddedData.Crit = crit;
      }

      /** Handle Fumbles **/
      let fumbleDie = this.GetFumbleDice();

      if (FirstDiceRoll == 1) {
          const pack = game.packs.get('totalcc.fumbles');
          await pack.getIndex(); //Load the compendium index
          let entry = pack.index.find(entity => entity.name.startsWith("Fumble"));
          const table = await pack.getEntity(entry._id);
          const FumbleRole = new Roll(`${fumbleDie} - ${LuckMod}`);
          const fumbleResult = await table.draw({'roll': FumbleRole, 'displayChat': false});
          let fumble = `<span style="color:red; font-weight: bolder">Fumble!</span> ${fumbleResult.results[0].text}</span>`;
          AddedData.Fumble = fumble;
      }


      this.GraphicCharRoll(weapon, diceRoll, AddedData);


  }




  GetItemActionDice(ItemData) {
    if (ItemData.actiondice && ItemData.actiondice.actiondiceoverride)
    {
      return ItemData.actiondice.value;
    }
    return this.data.data.attributes.actiondice.value;
  }


  async rollItem(ItemID, options = {}) {
    const Item = this.getOwnedItem(ItemID);
    const speaker = {alias: this.name, _id: this._id};
    const CharData = this.data.data;
    const ItemData = Item.data.data;

    let formula = this.GetItemActionDice(ItemData);

    let roll = new Roll(formula);

    roll = await this.rolldice(roll);

    let AddedData = {};

    if (ItemData.activation.useactivationtext)
    {
    AddedData.SpecialText = ItemData.activation.activationtext;
    }

    this.GraphicCharRoll(Item, roll, AddedData);

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
        if (SkillData.abilitiesmodifyer == "agility")
        {
          AbilityMod += ` - ` + this.CalculateArmorPenelty();
        }
      }

      let formula = this.GetItemActionDice(SkillData);

      if (options.mod)
      {
        formula += options.mod;
      }



      formula += `${AbilityMod} + ${SkillData.bonus}`;

      if (SkillData.additionalmod != "")
      {
        formula += `+ ${SkillData.additionalmod}`;
      }

      /* Roll the SKILL */
      let roll = new Roll(formula, {CharData, SkillData});

      roll = await this.rolldice(roll);
      //roll.roll();

      let label = `Rolling skill ${skill.name}`;


      this.rollFromTable(skill, roll, label);

    }


    async rollMutation(skillID, options = {}) {
      const Mutation = this.getOwnedItem(skillID);
      const speaker = {alias: this.name, _id: this._id};
      const CharData = this.data.data;
      const MutationData = Mutation.data.data;

      let formula = this.GetItemActionDice(MutationData);

      //Add mutation check bonus
      if (CharData.attributes.mutationbonus)
      {
      formula += ` + ${CharData.attributes.mutationbonus.value}`;
      }

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

      let formula = this.GetItemActionDice(SpellData);
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


      let AddedData = {};

      if (ItemData.data.data.activation.useactivationtext)
      {
      AddedData.SpecialText = ItemData.data.data.activation.activationtext;
      }


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

      if (!roll._rolled)
      {
        roll = await this.rolldice(roll);
      }

      if (!table)
      {
        this.GraphicCharRoll(ItemData, roll, AddedData);
        return;
      }


      //const tableresult = await table.draw({'roll': roll.total, 'displayChat': true});
      const tableresult = await table._getResultsForRoll(roll.total);
      if (tableresult[0] && tableresult[0].text)
      {
        AddedData.TableCopy = tableresult[0].text;
      }

      this.GraphicCharRoll(ItemData, roll, AddedData);

    }

  /**
   * Roll a Saving Throw
   * @param {String} saveId       The save ID (e.g. "str")
   */
  rollSavingThrow (saveId) {
    const save = this.data.data.attributes.saves[saveId];
    save.label = CONFIG.DCC.saves[saveId];
    const roll = new Roll('1d20+@saveMod', { saveMod: save.value })

    // Convert the roll to a chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${game.i18n.localize(save.label)} Save`
    })
  }


    /**
   * Roll an Ability Check
   * @param {String} abilityId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability checks are rolled
   */
  rollAbilityCheck (abilityId, options = {}) {
    const ability = this.data.data.abilities[abilityId]
    ability.label = CONFIG.DCC.abilities[abilityId]

    let roll = new Roll('1d20+@abilMod', { abilMod: ability.mod, critical: 20 })

    // Override the Roll for Luck Checks unless they explicitly click on the modifier
    if ((abilityId === 'luck') && (options.event.currentTarget.className !== 'ability-modifiers')) {
      roll = new Roll('1d20')
    }


    // Convert the roll to a chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${game.i18n.localize(ability.label)} Check`
    })
  }

  /**
   * Roll Initiative
   */
  rollInitiative () {
    const init = this.data.data.attributes.init.value
    const roll = new Roll('1d20+@init', { init })

    // Convert the roll to a chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: "Init"
    })

    // Set initiative value in the combat tracker if there is an active combat
    if (this.token && game.combat) {
      const tokenId = this.token.id

      // Create or update combatant
      let combatant = game.combat.getCombatantByToken(tokenId)
      if (!combatant) {
        combatant = game.combat.createCombatant({ tokenId, hasRolled: true, initiative: roll.total })
      } else {
        game.combat.setInitiative(combatant._id, roll.total)
      }
    }
  }



  async rollArtifactOnItem(ItemID, options = {})
   {
    const Item = this.getOwnedItem(ItemID);
    const speaker = {alias: this.name, _id: this._id};
    const CharData = this.data.data;
    const ItemData = Item.data.data;


    const ArtifactSkill = this.data.items.find(entity => entity.name.startsWith("Artifact Check"));
    if (ArtifactSkill)
    {
    this.rollSkill(ArtifactSkill._id, { "mod" : ` - ${ItemData.artifact.cm}`});
    }
  }

  
/**
 * Present a Dialog form which creates a d20 roll once submitted
 * @return {Promise<Roll>}
 * @private
 */
 async d20RollDialog(BaseRoll)
 {
   let template = "systems/totalcc/templates/apps/diceChain.html";
   let dialogData = 
   {
     formula: BaseRoll.formula,
     config: CONFIG.DCC
   };
   let DiceChain = CONFIG.DCC.DICE_CHAIN;
   let DiceFace = BaseRoll.dice[0].faces;
   let DiceChainIndex = DiceChain.findIndex( (element) => element == DiceFace);
   const html = await renderTemplate(template, dialogData);
   let dialogOptions = {};
   let title = "Dice Chain?";

   // Create the Dialog window
   let OutValue = await new Promise(resolve => {
    let OutButtons = {};
    for (let i = -3; i <= 3; i++) 
    {
     if(typeof DiceChain[DiceChainIndex + i] === 'undefined') 
     {
       // does not exist
     }
     else 
     {
       let NewButton = {};
       let ButtonName = "Button" + i;
       OutButtons[ButtonName] = 
       {
         label: "d" + DiceChain[DiceChainIndex+i],
         callback: html => resolve({ faces: DiceChain[DiceChainIndex+i] , form : html[0].querySelector("form")})
       }
     }
   }
     new Dialog({
       title: title,
       content: html,
       buttons: OutButtons,
       default: "Button0",
       close: () => resolve(null)
     }, dialogOptions).render(true);
   });

   let FormMod = OutValue.form.elements[1].value;
   BaseRoll.dice[0].faces = OutValue.faces;
   
   let NewRoll = new Roll(BaseRoll.formula + " + @mod", {mod : FormMod});
   //NewRoll.evaluate();
   return NewRoll;
 }

  async rolldice(inRoll)
  {
    inRoll = await this.d20RollDialog(inRoll);

    if (game.dice3d) {
      await game.dice3d.showForRoll(inRoll, game.user, false);
      if (!inRoll.rolled)
      {
        inRoll.evaluate();
      }
    }
     else
     {
      inRoll.evaluate();
    }
    return inRoll;
  }


  formatRoll (roll, formula) {
    const rollData = escape(JSON.stringify(roll))

    return `<a class="inline-roll inline-result" data-roll="${rollData}" title="${formula}"><i class="fas fa-dice-d20"></i> ${roll.total}</a>`
  }



  async GraphicCharRoll(item, roll, additionalinfo)
  {

    const RollHTML = this.formatRoll(roll, roll.formula);

      // Basic template rendering data
      //const token = this.actor.token;
      const templateData = {
        actor: this.actor,
        //tokenId: token ? `${token.scene._id}.${token.id}` : null,
        item: item,
        data: this.data,
        roll : roll,
        rollhtml : RollHTML,
        additionalinfo : additionalinfo
      };

      // Render the chat card template
      const template = `systems/totalcc/templates/chat/item-card.html`;
     const html = await renderTemplate(template, templateData);

      // Basic chat message data
      const chatData = {
        user: game.user._id,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: html,
        speaker: {
          actor: this._id,
          token: this.token,
          alias: this.name,
        }
      };

      // Toggle default roll mode
      //let rollMode = game.settings.get("core", "rollMode");
     // if (["gmroll", "blindroll"].includes(rollMode))
      //  chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
     // if (rollMode === "blindroll") chatData["blind"] = true;

      // Create the chat message
      return ChatMessage.create(chatData);
  }

  getChatData(htmlOptions) {
    const data = duplicate(this.data.data);

    // Rich text description
    //data.description = TextEditor.enrichHTML(data.description, htmlOptions);

    // Item properties
   // const props = [];
   // const labels = this.labels;

   // if (this.data.type == "weapon") {
   //   props.push(data.qualities);
   // }
   // if (this.data.type == "spell") {
   //   props.push(`${data.class} ${data.lvl}`, data.range, data.duration);
   // }
   // if (data.hasOwnProperty("equipped")) {
    //  props.push(data.equipped ? "Equipped" : "Not Equipped");
   // }

    // Filter properties and return
   // data.properties = props.filter((p) => !!p);
    return data;
  }



}


