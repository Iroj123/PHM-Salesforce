public with sharing class AttendanceController {

    @AuraEnabled(cacheable=true)
    public static Attendance__c getTodayAttendance() {
        Attendance__c att;
        try {
            att = [SELECT Id, Check_In__c, Check_Out__c, Status__c
                   FROM Attendance__c
                   WHERE Pharmacist__c = :UserInfo.getUserId()
                   AND Date__c = TODAY
                   LIMIT 1];
        } catch (Exception e) {
            att = null;
        }
        return att;
    }

    @AuraEnabled
    public static Attendance__c saveAttendance() {
        Attendance__c att;

        try {
            att = [SELECT Id, Check_In__c, Check_Out__c, Status__c
                   FROM Attendance__c
                   WHERE Pharmacist__c = :UserInfo.getUserId()
                   AND Date__c = TODAY
                   LIMIT 1];
        } catch (Exception e) {
            att = null;
        }

        if(att == null) {
            // First login → create attendance
            att = new Attendance__c(
                Pharmacist__c = UserInfo.getUserId(),
                Date__c = Date.today(),
                Check_In__c = System.now(),
                Status__c = 'In_Progress'
            );
            insert att;
        } else if(att.Check_In__c != null && att.Check_Out__c == null) {
             // Check-Out
        att.Check_Out__c = System.now();

        // Calculate total hours
        Datetime checkIn = att.Check_In__c;
        Datetime checkOut = att.Check_Out__c;
        Decimal totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000*60*60);

        // Set status based on hours
        if(totalHours < 8){
            att.Status__c = 'Incomplete';
        } else {
            att.Status__c = 'Completed';
        }

        update att;


        
        } else if(att.Check_Out__c != null) {
            // Already checked out
            throw new AuraHandledException('You have already checked out for today.');
        }

        return att;
    }

@AuraEnabled(cacheable=true)
    public static String getUserName() {
        User u = [SELECT Name FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        return u.Name;
    }


}



