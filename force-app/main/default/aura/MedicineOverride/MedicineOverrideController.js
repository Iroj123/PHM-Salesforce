({
    init : function(component) {
        component.set("v.items", [
            { medicineId: '', qty: 1, price: 0 }
        ]);
    },

    addRow : function(component) {
        let items = component.get("v.items");
        items.push({ medicineId: '', qty: 1, price: 0 });
        component.set("v.items", items);
    },

    save : function(component) {
        let action = component.get("c.saveAll");

        action.setParams({
            supplierId : component.get("v.supplierId"),
            purchaseDate : component.get("v.purchaseDate"),
            itemsJson : JSON.stringify(component.get("v.items"))
        });

        action.setCallback(this, function(resp) {
            if (resp.getState() === "SUCCESS") {
                $A.get("e.force:navigateToObjectHome")
                    .setParams({ scope: "Purchase__c" })
                    .fire();
            } else {
                alert(resp.getError()[0].message);
            }
        });

        $A.enqueueAction(action);
    },

    cancel : function() {
        $A.get("e.force:closeQuickAction").fire();
    }
})
