import { LightningElement, wire, track } from 'lwc';
import getTodaysSales from '@salesforce/apex/PharmacyDashboardController.getTodaysSales';

export default class TodaysSales extends LightningElement {

    @track salesList = [];
    totalAmount = 0;

    // 🔹 Datatable columns
    columns = [
        {
            label: 'Sale No',
            fieldName: 'Name',
            type: 'text'
        },
        {
            label: 'Customer',
            fieldName: 'customerName',
            type: 'text'
        },
        {
            label: 'Sale Date',
            fieldName: 'Sale_Date__c',
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }
        },
        {
            label: 'Amount (₹)',
            fieldName: 'Total_Amount__c',
            type: 'currency',
            typeAttributes: {
                currencyCode: 'INR'
            },
            cellAttributes: {
                alignment: 'right'
            }
        }
    ];

    // 🔹 Apex wire
    @wire(getTodaysSales)
    wiredSales({ error, data }) {
        if (data) {
            // flatten Customer name for datatable
            this.salesList = data.map(sale => ({
                ...sale,
                customerName: sale.Customer__r ? sale.Customer__r.Name : ''
            }));

            // calculate total
            this.totalAmount = data.reduce(
                (sum, sale) => sum + (sale.Total_Amount__c || 0),
                0
            );
        } else if (error) {
            console.error('Error fetching today sales:', error);
        }
    }

    get hasSales() {
        return this.salesList.length > 0;
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
