/**
 * A specialized form used to select from a checklist of attributes, traits, or properties
 * @extends {FormApplication}
 */
export default class MultiUseWepFrom extends FormApplication {

    /** @override */
      static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
          id: "MultiuseWep",
        classes: ["totalcc", "sheet", "item"],
        title: "Edit Weapon Function",
        template: "systems/totalcc/templates/item/MultiuseSheet.html",
        width: 800,
        height: 600,
        choices: {},
        MFWep : {},
        resizeable:true,
        tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
      });
    }
  
    /* -------------------------------------------- */
  
    /**
     * Return a reference to the target attribute
     * @type {String}
     */
    get attribute() {
        return this.options.name;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
  
      this.resizeable = true;
    const item = this.object;
    const itemdata = item.data.data;
    const MFWep = item.HasMultifuncWep(this.options.MFID) ;





      // Get current values
      let attr = getProperty(this.object.data, this.attribute) || {};
      attr.value = attr.value || [];
  
        // Populate choices
      const choices = duplicate(this.options.choices);
      for ( let [k, v] of Object.entries(choices) ) {
        choices[k] = {
          label: v,
          chosen: attr ? attr.value.includes(k) : false
        }
      }
  
      // Return data
        return {
        item : item,
        MFWep : MFWep,
        data : MFWep.data
      }
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    _updateObject(event, formData) {
      const item = this.object;
      const itemdata = item.data.data;
      let MFWep = item.HasMultifuncWep(this.options.MFID) ;


      const updateData = duplicate(this.object);
  
      const MFWepID = item.FindMultiFuncWepKey(MFWep._id);

      for ( let [k, v] of Object.entries(formData) ) {

        let karray = k.split('.');

        if (karray.length == 1)
        {
            updateData.data.multifunctional.weapons[MFWepID][karray[0]] = v
        }
        if (karray.length == 2)
        {
            updateData.data.multifunctional.weapons[MFWepID][karray[0]][karray[1]] = v
        }
        if (karray.length == 3)
        {
            updateData.data.multifunctional.weapons[MFWepID][karray[0]][karray[1]][karray[2]] = v
        }
        if (karray.length == 4)
        {
            updateData.data.multifunctional.weapons[MFWepID][karray[0]][karray[1]][karray[2]][karray[3]] = v
        }

        //let myobj = this.resolve(k, updateData.data.multifunctional.weapons[MFWepID]);
        //myobj = v;

       // updateData[`data.data.multifunctional.weapons[${MFWepID}].${k}`] = v;
      }
  

      // Update the object
      this.object.update(updateData);
    }


    resolve(path, obj) {
        return path.split('.').reduce(function(prev, curr) {
            return prev ? prev[curr] : null
        }, obj || self)
    }
  }
  