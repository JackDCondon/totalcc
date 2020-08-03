/**
 *  Parses NPC Stat Blocks (e.g. from published modules) into an NPC sheet
 *  @param {string} npcString the NPC stat block to import
 **/
export function parseNPC(npcString) {
    let npc = {};
    npcString = npcString.replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/, '');
    npc.name =  npcString.replace(/(.*):.*/, '$1').replace(/ ?\(\d+\)/, '').split(':')[0];
    npc["data.attributes.init.value"] = npcString.replace(/.*Init ?(.+?);.*/, "$1");
    npc.attacks = npcString.replace(/.*Atk ?(.+?);.*/, "$1");
    if (npcString.includes("Dmg ")) npc.damage = npcString.replace(/.*Dmg ?(.+?);.*/, "$1");
    npc["data.attributes.ac.value"] = npcString.replace(/.*AC ?(.+?);.*/, "$1");
    npc["data.hp.value"] = npcString.replace(/.*(?:HP|hp) ?(\d+).*?;.*/, "$1");
    npc["data.hp.max"] = npcString.replace(/.*(?:HP|hp) ?(\d+).*?;.*/, "$1");
    if (npcString.includes("HD ")) npc["data.attributes.hd.value"] = npcString.replace(/.*HD ?(.+?);.*/, "$1");
    npc["data.attributes.speed.value"] = npcString.replace(/.*MV ?(.+?);.*/, "$1");
    npc["data.attributes.actionDice.value"] = npcString.replace(/.*Act ?(.+?);.*/, "$1");
    if (npcString.includes("SP ")) npc["data.biography"] = npcString.replace(/.*SP ?(.+?);.*/, "$1");
    npc["data.attributes.saves.fort.value"] = npcString.replace(/.*Fort ?(.+?),.*/, "$1");
    npc["data.attributes.saves.ref.value"] = npcString.replace(/.*Ref ?(.+?),.*/, "$1");
    npc["data.attributes.saves.will.value"] = npcString.replace(/.*Will ?(.+?);*/, "$1");

    /* Speed */
    if (npc["data.attributes.speed.value"].includes("or")) {
        npc["data.attributes.speed.other"] = npc["data.attributes.speed.value"].replace(/.* or (.*)/, "$1");
        npc["data.attributes.speed.value"] = npc["data.attributes.speed.value"].replace(/(.*) or.*/, "$1");
    }

    npc["Weapons"] = [];
    /* Attacks */
    let attackStringOne, attackStringTwo;
    if (npc.attacks.includes(" or ")) {
        attackStringTwo = npc.attacks.replace(/.* or (.*)/, "$1");
        attackStringOne = npc.attacks.replace(/(.*) or.*/, "$1");
        const parsedAttackOne = _parseAttack(attackStringOne, npc.damage);
        const parsedAttackTwo = _parseAttack(attackStringTwo, npc.damage);
        npc["Weapons"].push(parsedAttackOne);
        npc["Weapons"].push(parsedAttackTwo);

    } else {
        attackStringOne = npc.attacks;
        const parsedAttackOne = _parseAttack(attackStringOne, npc.damage);
        npc["Weapons"].push(parsedAttackOne);
    }

    return npc;
}

/** Parse out a attack string into fields
 * @param {string} attackString  Full weapon string for a single attack
 * @param {string} damageString  Damage string for blocks with damage separate
 */
function _parseAttack(attackString, damageString) {
    let attack = {}
    attack.name = attackString.replace(/(.*?) [+-].*/, "$1");
    attack.toHit = attackString.replace(/.*? ([+-].*?) .*/, "$1");
    attack.special = "";
    attack.damage = "";
    attack.range = "Melee";
    if (attackString.includes("ranged")) attack.range = "Ranged";
    if (attackString.includes("missile")) attack.range = "Ranged";
    if (damageString) {
        attack.damage = damageString;
    } else {
        if (attackString.match(/.*\(\w+ (.*)\).*/)) attack.special = attackString.replace(/.*\(\w+ (.*)\).*/, "$1");
        attack.damage = attackString.replace(/.*\((\w+).*\).*/, "$1");
    }
    return attack;
}