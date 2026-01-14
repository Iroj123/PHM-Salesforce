public with sharing class PurchaseController {

    

    @AuraEnabled
    public static Id savePurchaseWithItems(
        String supplierId, 
        Date purchaseDate,
        List<Map<String, Object>> items
    ) {
       if (String.isBlank(supplierId)) {
        throw new AuraHandledException('Supplier is required.');
    }

    Id supId;
    try {
        supId = Id.valueOf(supplierId);
    } catch (Exception e) {
        throw new AuraHandledException('Invalid Supplier selected.');
    }

        if (purchaseDate == null) {
    throw new AuraHandledException('Purchase Date is required.');
}
if (purchaseDate > System.today()) {
    throw new AuraHandledException('Purchase Date cannot be in the future.');
}


        if (items == null || items.isEmpty()) {
            throw new AuraHandledException('At least one Purchase Item is required.');

        }
        

        // Create Purchase
        Boolean canApprove =
            FeatureManagement.checkPermission('Can_Approve_Purchase');

        Purchase__c purchase = new Purchase__c(
            Supplier__c = supplierId,
            Purchase_Date__c = purchaseDate
        );

        // 🔥 Decision logic
        if (canApprove) {
            purchase.Status__c = 'Approved';
        } else {
            purchase.Status__c = 'Draft';
        }



        
        insert purchase;

        // Create Purchase Items
        List<Purchase_Item__c> purchaseItems = new List<Purchase_Item__c>();

        for (Map<String, Object> item : items) {

            // Medicine Id (safe cast)
            Id medId = (Id) item.get('medicineId');

            // Quantity (String → Decimal)
            Object qtyObj = item.get('quantity');
            Decimal qty = qtyObj == null
                ? null
                : Decimal.valueOf(String.valueOf(qtyObj));

            // Cost Price (String → Decimal)
            Object costObj = item.get('costPrice');
            Decimal cost = costObj == null
                ? null
                : Decimal.valueOf(String.valueOf(costObj));

            // Validations
            if (medId == null) {
                throw new AuraHandledException('Medicine is required for all items.');
            }

            if (supplierId == null) {
                throw new AuraHandledException('Supplier is required.');

            }
            if (qty == null || qty <= 0) {
                throw new AuraHandledException('Quantity must be greater than 0.');
            }
            if (cost == null || cost <= 0) {
                throw new AuraHandledException('Cost Price must be greater than 0.');
            }

            purchaseItems.add(new Purchase_Item__c(
                Purchase__c = purchase.Id,
                Medicine__c = medId,
                Quantity__c = qty,
                Cost_Price__c = cost
            ));
        }

        insert purchaseItems;
        return purchase.Id;
    }

    // ---------------- LOOKUP DATA ----------------

    @AuraEnabled(cacheable=true)
    public static List<Map<String,String>> getMedicines() {
        List<Map<String,String>> meds = new List<Map<String,String>>();
        for (Medicine__c m : [
            SELECT Id, Medicine_Name__c
            FROM Medicine__c
            WHERE Is_Active__c = true
            ORDER BY Medicine_Name__c
        ]) {
            meds.add(new Map<String,String>{
                'label' => m.Medicine_Name__c,
                'value' => m.Id
            });
        }
        return meds;
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String,String>> getSuppliers() {
        List<Map<String,String>> suppliers = new List<Map<String,String>>();
        for (Supplier__c sup : [
            SELECT Id, Name
            FROM Supplier__c
            ORDER BY Name
        ]) {
            suppliers.add(new Map<String,String>{
                'label' => sup.Name,
                'value' => sup.Id
            });
        }
        return suppliers;
    }
}
