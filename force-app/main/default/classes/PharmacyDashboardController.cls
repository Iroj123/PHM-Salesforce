public with sharing class PharmacyDashboardController {
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new Map<String, Object>();

        // Total Customers
        summary.put('totalCustomers', [SELECT COUNT() FROM Customer__c]);

        // Total Medicines
        summary.put('totalMedicines', [SELECT COUNT() FROM Medicine__c]);

        // Total Sales
        summary.put('totalSales', [SELECT COUNT() FROM Sale__c]);

        // Total Revenue
        AggregateResult[] revenueResult = [SELECT SUM(Total_Amount__c) totalRevenue FROM Sale__c];
        summary.put('totalRevenue', (Decimal)revenueResult[0].get('totalRevenue'));

        return summary;
    }



    @AuraEnabled(cacheable=true)
    public static List<Medicine__c> getLowStockMedicines() {
    return [
        SELECT Id, Medicine_Name__c, Stock_Quantity__c
        FROM Medicine__c
        WHERE Stock_Quantity__c <= 10
        ORDER BY Stock_Quantity__c ASC
    ];
}


@AuraEnabled(cacheable=true)
public static List<Medicine__c> getExpiringMedicines() {
    Date today = Date.today();
    Date next30Days = today.addDays(30);

    return [
        SELECT Id,
               Medicine_Name__c,
               Batch_Number__c,
               Expiry_Date__c
        FROM Medicine__c
        WHERE Expiry_Date__c <= :next30Days
        ORDER BY Expiry_Date__c ASC
    ];
}



@AuraEnabled(cacheable=true)
public static List<Sale__c> getTodaysSales() {
    Date today = Date.today();

    return [
        SELECT Id,
               Name,
               Sale_Date__c,
               Total_Amount__c,
               Customer__r.Name
        FROM Sale__c
        WHERE Sale_Date__c = :today
        ORDER BY CreatedDate DESC
    ];
}



}
