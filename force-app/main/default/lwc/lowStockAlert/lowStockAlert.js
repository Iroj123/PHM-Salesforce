import { LightningElement, wire, track } from 'lwc';
import getLowStockMedicines from '@salesforce/apex/PharmacyDashboardController.getLowStockMedicines';

export default class LowStockAlert extends LightningElement {

    @track lowStockList = [];
    lowStockCount = 0;

    // 🔹 Datatable columns
    columns = [
        {
            label: 'Medicine Name',
            fieldName: 'Medicine_Name__c',
            type: 'text'
        },
        {
            label: 'Quantity',
            fieldName: 'Stock_Quantity__c',
            type: 'number',
            cellAttributes: {
                class: 'slds-text-color_error slds-text-heading_small',
                alignment: 'center'
            }
        }
    ];

    // 🔹 Apex wire
    @wire(getLowStockMedicines)
    wiredMedicines({ error, data }) {
        if (data) {
            this.lowStockList = data;
            this.lowStockCount = data.length;
        } else if (error) {
            console.error('Error fetching low stock medicines:', error);
        }
    }

    // 🔹 UI condition
    get hasLowStock() {
        return this.lowStockCount > 0;
    }
get tableStyle() {
    const rowHeight = 32;      // approx row height
    const headerHeight = 40;  // datatable header
    const maxRows = 10;

    const rowCount = this.salesList.length;

    // show exact height for small data, max height for large data
    const visibleRows = Math.min(rowCount, maxRows);

    const height = (visibleRows * rowHeight) + headerHeight;

    return `height: ${height}px;`;
}




}




