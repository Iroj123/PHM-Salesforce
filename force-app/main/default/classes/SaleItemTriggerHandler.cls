public class SaleItemTriggerHandler {

    public static void updateSaleTotals(
        List<Sale_Item__c> newList,
        List<Sale_Item__c> oldList
    ) {
        // 1️⃣ Collect Sale Ids
        Set<Id> saleIds = new Set<Id>();

        if (newList != null) {
            for (Sale_Item__c si : newList) {
                if (si.Sale__c != null) {
                    saleIds.add(si.Sale__c);
                }
            }
        }

        if (oldList != null) {
            for (Sale_Item__c si : oldList) {
                if (si.Sale__c != null) {
                    saleIds.add(si.Sale__c);
                }
            }
        }

        if (saleIds.isEmpty()) return;

        // 2️⃣ Aggregate Sale Item totals
        Map<Id, Decimal> totalsBySale = new Map<Id, Decimal>();

        for (AggregateResult ar : [
            SELECT Sale__c saleId, SUM(Total_Price__c) total
            FROM Sale_Item__c
            WHERE Sale__c IN :saleIds
            GROUP BY Sale__c
        ]) {
            totalsBySale.put(
                (Id) ar.get('saleId'),
                (Decimal) ar.get('total')
            );
        }

        // 3️⃣ Prepare Sale updates
        List<Sale__c> salesToUpdate = new List<Sale__c>();

        for (Id saleId : saleIds) {
            salesToUpdate.add(new Sale__c(
                Id = saleId,
                Total_Amount__c = totalsBySale.containsKey(saleId)
                    ? totalsBySale.get(saleId)
                    : 0
            ));
        }

        if (!salesToUpdate.isEmpty()) {
            update salesToUpdate;
        }
    }
}