// import { LightningElement, track } from 'lwc';
// import getTodayAttendance from '@salesforce/apex/AttendanceController.getTodayAttendance';
// import saveAttendance from '@salesforce/apex/AttendanceController.saveAttendance';
// import getUserName from '@salesforce/apex/AttendanceController.getUserName';
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// export default class AttendanceDashboard extends LightningElement {
//     @track attendance;
//     @track userName;
//     @track loading = false;

//     connectedCallback() {
//         this.loadData();
//     }

//     loadData() {
//         getUserName()
//             .then(result => {
//                 this.userName = result;
//             });

//         getTodayAttendance()
//             .then(result => {
//                 this.attendance = result;
//             });
//     }

//     handleClick() {
//         this.loading = true;
//         saveAttendance()
//             .then(result => {
//                 this.attendance = result;
//                 this.loading = false;
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Success',
//                         message: this.attendance.Check_In__c && !this.attendance.Check_Out__c ? 
//                                  'Checked In!' : 'Checked Out!',
//                         variant: 'success'
//                     })
//                 );
//             })
//             .catch(error => {
//                 this.loading = false;
//                 let msg = 'Error';
//                 if(error.body && error.body.message) msg = error.body.message;
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Error',
//                         message: msg,
//                         variant: 'error'
//                     })
//                 );
//             });
//     }

//     get buttonLabel() {
//         if (!this.attendance) return 'Check In';
//         return this.attendance.Check_In__c && !this.attendance.Check_Out__c ? 'Check Out' : 'Check In';
//     }

//     get totalHours() {
//         if(this.attendance && this.attendance.Check_In__c && this.attendance.Check_Out__c){
//             let checkIn = new Date(this.attendance.Check_In__c);
//             let checkOut = new Date(this.attendance.Check_Out__c);
//             let diff = (checkOut - checkIn) / (1000 * 60 * 60);
//             return diff.toFixed(2);
//         }
//         return '-';
//     }
// }


import { LightningElement, track } from 'lwc';
import getTodayAttendance from '@salesforce/apex/AttendanceController.getTodayAttendance';
import saveAttendance from '@salesforce/apex/AttendanceController.saveAttendance';
import getUserName from '@salesforce/apex/AttendanceController.getUserName';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AttendanceDashboard extends LightningElement {
    @track attendance;
    @track userName;
    @track loading = false;

    timer;

    connectedCallback() {
        this.loadData();

        // ⏱ Update every second for HH:mm:ss
        this.timer = setInterval(() => {
            this.refreshTimer();
        }, 1000);
    }

    disconnectedCallback() {
        clearInterval(this.timer);
    }

    refreshTimer() {
        if (this.attendance) {
            this.attendance = { ...this.attendance };
        }
    }

    loadData() {
        getUserName().then(result => {
            this.userName = result;
        });

        getTodayAttendance().then(result => {
            this.attendance = result;
        });
    }

    handleClick() {
        this.loading = true;
        saveAttendance()
            .then(result => {
                this.attendance = result;
                this.loading = false;

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message:
                            this.attendance.Check_In__c && !this.attendance.Check_Out__c
                                ? 'Checked In!'
                                : 'Checked Out!',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                this.loading = false;
                let msg = 'Error';
                if (error.body && error.body.message) msg = error.body.message;

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: msg,
                        variant: 'error'
                    })
                );
            });
    }

    get buttonLabel() {
        if (!this.attendance) return 'Check In';
        return this.attendance.Check_In__c && !this.attendance.Check_Out__c
            ? 'Check Out'
            : 'Check In';
    }

    // ⏰ LIVE TOTAL TIME IN HH:mm:ss
    get totalHours() {
        if (this.attendance && this.attendance.Check_In__c) {
            const checkIn = new Date(this.attendance.Check_In__c);
            const checkOut = this.attendance.Check_Out__c
                ? new Date(this.attendance.Check_Out__c)
                : new Date(); // live time

            let diffMs = checkOut - checkIn;

            let hours = Math.floor(diffMs / (1000 * 60 * 60));
            let minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
        }
        return '--:--:--';
    }

    pad(value) {
        return value.toString().padStart(2, '0');
    }
}
