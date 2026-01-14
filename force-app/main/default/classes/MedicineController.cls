public with sharing class MedicineController {

    @AuraEnabled
    public static Id saveMedicine(
        String medicineName,
        String category,
        String batchNumber,
        Date expiryDate,
        Decimal unitPrice,
        Boolean isActive
    ) {

        //  Basic validations
        if (String.isBlank(medicineName)) {
            throw new AuraHandledException('Medicine Name is required');
        }
           if (String.isBlank(category)) {
            throw new AuraHandledException('Category must be selected.');
        }
        if (String.isBlank(batchNumber)) {
            throw new AuraHandledException('Batch Number is required');
        }

        if (expiryDate == null || expiryDate < Date.today() ) {
    throw new AuraHandledException('Expiry Date cannot be in the past or blank');
        }

        if (unitPrice == null || unitPrice <= 0) {
            throw new AuraHandledException('Unit Price must be greater than 0');
        }
        
        

        // 🧠 CREATE RECORD
        Medicine__c med = new Medicine__c();

        // 🔥 THIS IS THE MATCHING PART 🔥
        med.Name = medicineName;
        med.Medicine_Name__c = medicineName;
        med.Category__c      = category;
        med.Batch_Number__c  = batchNumber;
        med.Expiry_Date__c   = expiryDate;
        med.Unit_Price__c    = unitPrice;
        med.Is_Active__c     = isActive;

        insert med;

        // return record id after save
        return med.Id;
    }
   



    
}


