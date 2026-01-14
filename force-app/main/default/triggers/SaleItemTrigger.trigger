trigger SaleItemTrigger on Sale_Item__c (
    after insert, after update, after delete, after undelete
) {
    if (Trigger.isAfter) {
        if (Trigger.isInsert || Trigger.isUpdate || Trigger.isUndelete) {
            SaleItemTriggerHandler.updateSaleTotals(Trigger.new, null);
        }

        if (Trigger.isDelete) {
            SaleItemTriggerHandler.updateSaleTotals(null, Trigger.old);
        }
    }
}