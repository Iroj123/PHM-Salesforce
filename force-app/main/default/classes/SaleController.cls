public with sharing class SaleController {

    // ===================== SAVE SALE =====================
    @AuraEnabled
    public static Id saveSaleWithItems(
        String customerId,
        Date saleDate,
        List<Map<String, Object>> items
    ) {

        // -------- BASIC VALIDATIONS --------
        
       if (String.isBlank(customerId)) {
        throw new AuraHandledException('Customer is required.');
    }

    Id cusId;
    try {
        cusId = Id.valueOf(customerId);
    } catch (Exception e) {
        throw new AuraHandledException('Invalid Customer selected.');
    }
    

        if (saleDate == null)
            throw new AuraHandledException('Sale Date is required.');

        if (saleDate > System.today())
            throw new AuraHandledException('Sale Date must not be in the future.');

        if (items == null || items.isEmpty())
            throw new AuraHandledException('At least one medicine is required.');

        // -------- CREATE SALE --------
        Sale__c sale = new Sale__c(
            Customer__c = customerId,
            Sale_Date__c = saleDate
        );
        insert sale;

        // -------- COLLECT MEDICINE IDS --------
        Set<Id> medicineIds = new Set<Id>();
        for (Map<String, Object> item : items) {
            if (item.get('medicineId') != null) {
                medicineIds.add((Id) item.get('medicineId'));
            }
        }

        // -------- QUERY MEDICINES --------
        Map<Id, Medicine__c> medicineMap = new Map<Id, Medicine__c>(
            [
                SELECT Id, Medicine_Name__c, Stock_Quantity__c,Expiry_Date__c,Is_Active__c
                FROM Medicine__c
                WHERE Id IN :medicineIds
                FOR UPDATE
            ]
        );

        List<Sale_Item__c> saleItems = new List<Sale_Item__c>();
        Map<Id, Decimal> soldQtyMap = new Map<Id, Decimal>();

        // -------- VALIDATE & PREPARE ITEMS --------
        for (Map<String, Object> item : items) {

            Id medId = (Id) item.get('medicineId');
            Object qtyObj = item.get('quantity');
            Decimal qty = qtyObj == null ? 0 : Decimal.valueOf(String.valueOf(qtyObj));

            if (medId == null)
                throw new AuraHandledException('Medicine is required.');

            if (qty <= 0)
                throw new AuraHandledException('Quantity must be greater than 0.');

            Medicine__c med = medicineMap.get(medId);

            if (med == null)
                throw new AuraHandledException('Invalid medicine selected.');

                // 🔴 EXPIRY DATE VALIDATION
if (med.Expiry_Date__c != null && med.Expiry_Date__c < System.today()) {
    throw new AuraHandledException(
        med.Medicine_Name__c +
        ' is expired on ' +
        String.valueOf(med.Expiry_Date__c) +
        ' and cannot be sold'
    );}

    if (med.Is_Active__c == false) {
        throw new AuraHandledException(
            med.Medicine_Name__c +
            ' is inactive and cannot be sold.'
        );
    }



            // -------- STOCK CHECK --------
            Decimal alreadySold = soldQtyMap.containsKey(medId)
                ? soldQtyMap.get(medId)
                : 0;

            Decimal availableStock = med.Stock_Quantity__c - alreadySold;

            if (qty > availableStock) {
                throw new AuraHandledException(
                    med.Medicine_Name__c +
                    ' only has ' + availableStock + ' units in stock'
                );
            }

            // Track sold quantity per medicine
            soldQtyMap.put(medId, alreadySold + qty);

            // Create Sale Item
            saleItems.add(new Sale_Item__c(
                Sale__c = sale.Id,
                Medicine__c = medId,
                Quantity__c = qty
            ));
        }

        // -------- INSERT SALE ITEMS --------
        insert saleItems;

        // -------- UPDATE STOCK --------
        List<Medicine__c> medicinesToUpdate = new List<Medicine__c>();
        for (Id medId : soldQtyMap.keySet()) {
            Medicine__c med = medicineMap.get(medId);
            med.Stock_Quantity__c -= soldQtyMap.get(medId);
            medicinesToUpdate.add(med);
        }
        update medicinesToUpdate;

        return sale.Id;
    }

    // ===================== GET CUSTOMERS =====================
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getCustomers() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        for (Customer__c c : [
            SELECT Id, Name
            FROM Customer__c
            ORDER BY Name
        ]) {
            options.add(new Map<String, String>{
                'label' => c.Name,
                'value' => c.Id
            });
        }
        return options;
    }

    // ===================== GET MEDICINES =====================
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getMedicines() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        for (Medicine__c m : [
            SELECT Id, Medicine_Name__c
            FROM Medicine__c
            ORDER BY Medicine_Name__c
        ]) {
            options.add(new Map<String, String>{
                'label' => m.Medicine_Name__c,
                'value' => m.Id
            });
        }
        return options;
    }

    // ===================== CREATE CUSTOMER =====================
    @AuraEnabled
    public static Id createCustomer(
        String firstName,
        // String lastName,
        String email,
        String phone
    ) {
       if (String.isBlank(firstName)) {
        throw new AuraHandledException('Name is required');
    }

    // Email validation
    if (String.isBlank(email)) {
        throw new AuraHandledException('Email is required');
    }

    // Phone validation
    if (String.isBlank(phone)) {
        throw new AuraHandledException('Phone is required');
    }

    // Duplicate email check
    List<Customer__c> existingCustomers = [
        SELECT Id 
        FROM Customer__c 
        WHERE Email__c = :email 
        LIMIT 1
    ];

    if (!existingCustomers.isEmpty()) {
        throw new AuraHandledException('Email cannot be duplicate');
    }

        Customer__c c = new Customer__c(
            Name = firstName,
            // Last_Name__c = lastName,
            Email__c = email,
            Phone__c = phone
        );
        insert c;
        return c.Id;
    }

    // ===================== GET UNIT PRICE =====================
    @AuraEnabled(cacheable=true)
    public static Decimal getMedicineUnitPrice(Id medicineId) {
        return [
            SELECT Unit_Price__c
            FROM Medicine__c
            WHERE Id = :medicineId
            LIMIT 1
        ].Unit_Price__c;
    }
}