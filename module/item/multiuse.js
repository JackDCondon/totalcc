

export class Multiuse 
{

    constructor(data) {
        this.data = 
        {
            notes: "",
            activation: {
                useactivationtext: false,
                activationtext: ""
              },
              actiondice: {
                actiondiceoverride: false,
                value: "1d20"
              },
              charges : {
                cost : 1
            }
        };
        this._id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.name = "New Function";
    }

    ToJSON()
    {

        const originalClass = this || {}
        const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(originalClass))
        return keys.reduce((classAsObj, key) => {
          classAsObj[key] = originalClass[key]
          return classAsObj
        }, {})
    }


}



export class MultiuseWep extends Multiuse 
{

    constructor(data) {
        super(data);
        this.data.weaponstats = {
            "range" : "Melee",
            "damage" : "1d6",
            "type" : "Slashing",
            "attack" : "0"
        };
        this.data.dontrolldamage = false;
        this.type = "weapon";
    }
}



export class MultiuseWepEditWindow extends Dialog 
{

    constructor(data) {
        super(data);
        this.data.weaponstats = {
            "range" : "Melee",
            "damage" : "1d6",
            "type" : "Slashing",
            "attack" : "0"
        };
    }
}

