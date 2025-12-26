import { LightningElement, track } from 'lwc';
import getPharmacySummary from '@salesforce/apex/PharmacyReportController.getPharmacySummary';

export default class PharmacyDashboard extends LightningElement {
    @track totalPurchase = 0;
    @track totalSales = 0;
    @track totalLoss = 0;

    connectedCallback() {
        this.loadSummary();
    }

    loadSummary() {
        getPharmacySummary()
            .then(result => {
                this.totalPurchase = result.TotalPurchaseCost || 0;
                this.totalSales = result.TotalSales || 0;
                this.totalLoss = result.TotalLossDueToExpiry || 0;
            })
            .catch(error => {
                console.error('Error fetching pharmacy summary', error);
            });
    }
}
