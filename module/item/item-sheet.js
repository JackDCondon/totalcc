import {DCC} from '../config.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class totalccItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["totalcc", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/totalcc/templates/item";
    // Return a single sheet for all item types.
     return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    const item = data.item;
    const itemData = item.data;


    data.config = DCC;


    itemData.isspellbase = (item.type === "mutation" || item.type === "spell");

    if (item.type === "mutation")
    {
      itemData.ispassive = (itemData.mutationuse === "passive");
    }


    return data;


  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;


    // Rollable Item.
    html.find('.cm').click(this._onRollArtifact.bind(this));


    // Roll handlers, click handlers, etc. would go here.
  }



  async _onRollArtifact(event) 
  {
    event.preventDefault();
    if (this.item)
    {
      this.item.rollArtifact();
    }
  }










}
