import { LightningElement, wire, track } from 'lwc';
import getExpiringMedicines from '@salesforce/apex/PharmacyDashboardController.getExpiringMedicines';

export default class ExpiringMedicines extends LightningElement {

    @track expiringList = [];

    // 🔹 Datatable columns
    columns = [
        {
            label: 'Medicine Name',
            fieldName: 'Medicine_Name__c',
            type: 'text'
        },
        {
            label: 'Batch No',
            fieldName: 'Batch_Number__c',
            type: 'text'
        },
        {
            label: 'Expiry Date',
            fieldName: 'Expiry_Date__c',
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            },
            cellAttributes: {
                class: 'slds-text-color_error'
            }
        },
        {
            label: 'Days Left',
            fieldName: 'daysLeft',
            type: 'number',
            cellAttributes: {
                alignment: 'center',
                class: 'slds-text-heading_small'
            }
        }
    ];

    // 🔹 Apex wire
    @wire(getExpiringMedicines)
    wiredMedicines({ error, data }) {
        if (data) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // normalize today

            this.expiringList = data.map(med => {
                const expiryDate = new Date(med.Expiry_Date__c);
                expiryDate.setHours(0, 0, 0, 0); // normalize expiry

                const diffTime = expiryDate - today;
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    ...med,
                    daysLeft // 🔴 expired = negative, ⚠️ expiring = positive
                };
            });

        } else if (error) {
            console.error('Error fetching expiring medicines:', error);
        }
    }

    // 🔹 UI condition
    get hasExpiringMedicines() {
        return this.expiringList && this.expiringList.length > 0;
    }

  get tableStyle() {
    const rowHeight = 32;     // approx row height of one row
    const headerHeight = 40;  // datatable header height
    const maxRows = 10;       // max visible rows before scroll

    const rowCount = this.expiringList ? this.expiringList.length : 0;

    // number of visible rows
    const visibleRows = Math.min(rowCount, maxRows);

    const height = (visibleRows * rowHeight) + headerHeight;

    return `height: ${height}px;`; // must return a string
}


}
