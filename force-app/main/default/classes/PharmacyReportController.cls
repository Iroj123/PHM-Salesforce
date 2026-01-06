public with sharing class PharmacyReportController {
    @AuraEnabled(cacheable=true)
    public static Map<String, Decimal> getPharmacySummary() {
        Map<String, Decimal> summary = new Map<String, Decimal>();

        // Total Purchase Cost
        AggregateResult[] purchaseAgg = [
            SELECT SUM(Total_Amount__c) totalPurchase
            FROM Purchase__c where Status__c = 'Approved'
        ];
        summary.put('TotalPurchaseCost', (Decimal)purchaseAgg[0].get('totalPurchase'));

        // Total Sales
        AggregateResult[] salesAgg = [
            SELECT SUM(Total_Amount__c) totalSales
            FROM Sale__c
        ];
        summary.put('TotalSales', (Decimal)salesAgg[0].get('totalSales'));

        // Total Loss Due to Expired Medicines
        // Total Loss Due to Expired Medicines
Decimal totalLoss = 0;

// Get all expired medicines
 //Date next7Days = date.today().addDays(7);

List<Medicine__c> expiredMeds = [
    SELECT Stock_Quantity__c, Unit_Price__c
    FROM Medicine__c
    WHERE Expiry_Date__c < TODAY
];

// Calculate total loss in Apex
for (Medicine__c med : expiredMeds) {
    totalLoss += (med.Stock_Quantity__c != null ? med.Stock_Quantity__c : 0)
               * (med.Unit_Price__c != null ? med.Unit_Price__c : 0);
}

summary.put('TotalLossDueToExpiry', totalLoss);


        return summary;
    }

     
}
