import { LightningElement, track, wire } from 'lwc';
import getDashboardSummary from '@salesforce/apex/PharmacyDashboardController.getDashboardSummary';

export default class PharmacyDashboard extends LightningElement {
    @track totalCustomers = 0;
    @track totalMedicines = 0;
    @track totalSales = 0;
    @track totalRevenue = 0;

    @wire(getDashboardSummary)
    wiredSummary({ error, data }) {
        if(data) {
            this.totalCustomers = data.totalCustomers;
            this.totalMedicines = data.totalMedicines;
            this.totalSales = data.totalSales;
            this.totalRevenue = data.totalRevenue ? data.totalRevenue : 0;
        } else if(error) {
            console.error('Error fetching dashboard data', error);
        }
    }
}
