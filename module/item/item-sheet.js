import {DCC} from '../config.js';
import MultiUseWepFrom from '../item/multiuseform.js';



/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class totalccItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["totalcc", "sheet", "item"],
      width: 800,
      height: 500,
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


    // Artifact check Item.
    html.find('.cm').click(this._onRollArtifact.bind(this));

    
    // Create Rollable Item.
    html.find('.multiusewep-create').click(this._onAddWeaponMultiuse.bind(this));

    // Roll MF Rollable Item.
    html.find('.rollmfwep').click(this._OnRollMFWeapon.bind(this));



    // Delete Inventory Item
    html.find('.multiusewep-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.item.RemoveMultifuncWep(li.data("itemId"));
      this.render();
    });


    // Edit MF Inventory Item
    html.find('.multiusewep-edit').click(this._onEditWeaponMultiuse.bind(this));




    if (this.actor.owner) {
      let handler = ev => this._onDragItemStart(ev);
      html.find('h4.item-name').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }


    // Roll handlers, click handlers, etc. would go here.
  }


  _onDragItemStart(event) 
  {
    const li = $(event.currentTarget).parents(".item");
    const ItemID = li.data("itemId");

    const mfitem = this.item.HasMultifuncWep(ItemID);

    const dragData = {
      type: "MFItem",
      actorId: this.actor.id,
      data: { itemdata : this.item, mfid : mfitem.name}
    };
    if (this.actor.isToken)
    {
       dragData.tokenId = this.actor.token.id;
    }
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }



  async _onRollArtifact(event) 
  {
    event.preventDefault();
    if (this.item)
    {
      this.item.rollArtifact();
    }
  }

  
  async _onAddWeaponMultiuse(event) 
  {
    event.preventDefault();
    if (this.item)
    {
      this.item.CreateMultifuncWep();
      this.render();
    }
  }


  async _OnRollMFWeapon(event) 
  {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    //const item = this.actor.getOwnedItem(li.data("itemId"));
    const ItemID = li.data("itemId");
    const mfitem = await this.item.HasMultifuncWep(ItemID);
    if (!mfitem)
    {
      return;
    }

    const options = { mfID : ItemID};

    this.item.roll(options);
  }

    
  async _onEditWeaponMultiuse(event) 
  {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    //const item = this.actor.getOwnedItem(li.data("itemId"));
    const ItemID = li.data("itemId");
    const item = await this.item.HasMultifuncWep(ItemID);
    
    const a = event.currentTarget;
    //const label = a.parentElement.querySelector("label");
    const options = {
      name: a.dataset.target,
      MFID : ItemID
    };
    new MultiUseWepFrom(this.item, options).render(true)
  }








}
