export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        //Character Sheets
        'systems/totalcc/templates/actors/actor-sheet.html',
        'systems/totalcc/templates/actors/npc-sheet.html',
        //Apps partials
        'systems/totalcc/templates/apps/diceChain.html',
        //Sheet tabs
        'systems/totalcc/templates/actor/partials/chargescomp.html',
        'systems/totalcc/templates/actor/partials/charateritems.html',
        `systems/totalcc/templates/actor/partials/attributesgrid.html`,
        `systems/totalcc/templates/actor/partials/attributes-character-list.html`
    ];
    return loadTemplates(templatePaths);
};
