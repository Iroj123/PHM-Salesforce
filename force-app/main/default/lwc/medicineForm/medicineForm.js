


import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import saveMedicine from '@salesforce/apex/MedicineController.saveMedicine';

export default class MedicineForm extends NavigationMixin(LightningElement) {

    // ---------- FORM FIELDS ----------
    medicineName = '';
    category = '';
    batchNumber = '';
    expiryDate = null;
    unitPrice = null;
    isActive = false;

    // ---------- PICKLIST OPTIONS ----------
    categoryOptions = [
        { label: 'Tablet', value: 'Tablet' },
        { label: 'Syrup', value: 'Syrup' },
        { label: 'Injection', value: 'Injection' }
    ];

    // ---------- FIELD HANDLERS ----------
    handleNameChange(event) {
        this.medicineName = event.target.value;
    }

    handleCategoryChange(event) {
        this.category = event.detail.value;
    }

    handleBatchChange(event) {
        this.batchNumber = event.target.value;
    }

    handleExpiryChange(event) {
        this.expiryDate = event.target.value;
    }

    handlePriceChange(event) {
        this.unitPrice = event.target.value;
    }

    handleActiveChange(event) {
        this.isActive = event.target.checked;
    }

    // ---------- BUTTON HANDLERS ----------
    handleSave() {
        this.saveRecord(false);
    }

    handleSaveAndNew() {
        this.saveRecord(true);
    }

    handleCancel() {
        this.navigateToMedicineList();
    }

    // ---------- COMMON SAVE METHOD ----------
    saveRecord(isSaveAndNew) {

        saveMedicine({
            medicineName: this.medicineName,
            category: this.category,
            batchNumber: this.batchNumber,
            expiryDate: this.expiryDate,
            unitPrice: this.unitPrice,
            isActive: this.isActive
        })
        .then((result) => {  // result should be the Id of the newly created medicine from Apex

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Success',
            message: 'Medicine record saved successfully',
            variant: 'success'
        })
    );

    // Dispatch event to parent Purchase component
    this.dispatchEvent(new CustomEvent('savemedicine', {
        detail: { 
            id: result,             // new Medicine Id returned from Apex
            name: this.medicineName // new Medicine Name
        }
    }));

    if (isSaveAndNew) {
        this.resetForm();
    }
    // Don't navigate away when used inside modal
//     this[NavigationMixin.Navigate]({
//     type: 'standard__objectPage',
//     attributes: {
//         objectApiName: 'Medicine__c',
//         actionName: 'list'
//     },
//     state: {
//         filterName: 'All' // or 'Recent' if you have it
//     }
// });
})

        .catch(error => {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error?.body?.message || 'Something went wrong',
                    variant: 'error'
                })
            );

            console.error(error);
        });
    }

    // ---------- RESET FORM (SAVE & NEW) ----------
    resetForm() {
        this.medicineName = '';
        this.category = '';
        this.batchNumber = '';
        this.expiryDate = null;
        this.unitPrice = null;
        this.isActive = false;
    }

    // ---------- NAVIGATION ----------
    navigateToMedicineList() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Medicine__c',
                actionName: 'list'
            },
            state: {
                filterName: 'Recent'
            }
        });
    }z
}
