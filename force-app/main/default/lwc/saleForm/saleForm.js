import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import saveSaleWithItems from '@salesforce/apex/SaleController.saveSaleWithItems';
import getCustomers from '@salesforce/apex/SaleController.getCustomers';
import getMedicines from '@salesforce/apex/SaleController.getMedicines';
import createCustomer from '@salesforce/apex/SaleController.createCustomer';
import getMedicineUnitPrice from '@salesforce/apex/SaleController.getMedicineUnitPrice';


export default class SaleForm extends NavigationMixin(LightningElement) {

    // Sale Fields
    @track customerId = '';
    @track saleDate = null;

    // Sale Items
    @track saleItems = [];

    // Lookup options
    @track customerOptions = [];
    @track medicineOptions = [];

    // New Customer Modal
    @track showNewCustomerModal = false;
    @track newCustomerFirstName = '';
    @track newCustomerLastName = '';
    @track newCustomerEmail = '';
    @track newCustomerPhone = '';

    connectedCallback() {
        this.addSaleItem(); // start with 1 item row
    }

    // Load options
    @wire(getCustomers)
    wiredCustomers({ data, error }) {
        if (data) this.customerOptions = data;
        if (error) console.error(error);
    }

    @wire(getMedicines)
    wiredMedicines({ data, error }) {
        if (data) this.medicineOptions = data;
        if (error) console.error(error);
    }

    // Sale field handlers
    handleCustomerChange(event) { this.customerId = event.detail.value; }
    handleDateChange(event) { this.saleDate = event.target.value; }

    // Sale Item handlers
    handleItemChange(event) {
    const index = event.target.dataset.index;
    const field = event.target.dataset.field;
    const value = event.detail.value;

    // Update field value
    this.saleItems[index][field] = value;

    // If medicine selected → fetch unit price
    if (field === 'medicineId' && value) {
        getMedicineUnitPrice({ medicineId: value })
            .then(price => {
                this.saleItems[index].unitPrice = price || 0;
                this.calculateRowTotal(index);
                this.saleItems = [...this.saleItems];
            })
            .catch(error => {
                console.error('Error fetching unit price', error);
            });
    }

    // If quantity changed → recalc total
    if (field === 'quantity') {
        this.calculateRowTotal(index);
        this.saleItems = [...this.saleItems];
    }
}


    addSaleItem() {
        const newItem = {
            id: Date.now() + Math.random(),
            medicineId: '',
            quantity: 1,
            unitPrice: 0,
            total: 0,
        };
        this.saleItems = [...this.saleItems, newItem];
    }

    removeSaleItem(event) {
        const index = event.target.dataset.index;
        this.saleItems.splice(index, 1);
        this.saleItems = [...this.saleItems];
    }

    // New Customer handlers
    handleNewCustomerClick() { this.showNewCustomerModal = true; }

    handleNewCustomerFirstNameChange(event) { this.newCustomerFirstName = event.target.value; }
    handleNewCustomerLastNameChange(event) { this.newCustomerLastName = event.target.value; }
    handleNewCustomerEmailChange(event) { this.newCustomerEmail = event.target.value; }
    handleNewCustomerPhoneChange(event) { this.newCustomerPhone = event.target.value; }

   handleSaveNewCustomer() {
    createCustomer({
        firstName: this.newCustomerFirstName,
        lastName: this.newCustomerLastName,
        email: this.newCustomerEmail,
        phone: this.newCustomerPhone
    })
    .then(result => {
        // Build the display label for combobox
        const newLabel = `${this.newCustomerFirstName} ${this.newCustomerLastName}`.trim();

        // Add the new customer to options immediately
        this.customerOptions = [
            ...this.customerOptions,
            { label: newLabel, value: result }
        ];

        // Automatically select the newly created customer
        this.customerId = result;

        // Reset modal fields
        this.showNewCustomerModal = false;
        this.newCustomerFirstName = '';
        this.newCustomerLastName = '';
        this.newCustomerEmail = '';
        this.newCustomerPhone = '';
    })
    .catch(error => {
        console.error('Error creating customer:', error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error',
            message: 'Failed to create customer',
            variant: 'error'
        }));
    });
}



    handleCancelNewCustomer() {
        this.showNewCustomerModal = false;
        this.newCustomerFirstName = '';
        this.newCustomerLastName = '';
        this.newCustomerEmail = '';
        this.newCustomerPhone = '';
    }

    // Save Sale
    handleSave() { this.saveRecord(false); }
    handleSaveAndNew() { this.saveRecord(true); }
    handleCancel() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: { objectApiName: 'Sale__c', actionName: 'list' },
            state: { filterName: 'Recent' }
        });
    }

    saveRecord(isSaveAndNew) {

         if (!this.saleItems || this.saleItems.length === 0) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Add at least one medicine',
                variant: 'error'
            })
        );
        return; // stop execution
    }


        saveSaleWithItems({
            customerId: this.customerId,
            saleDate: this.saleDate,
            items: this.saleItems
        })
        .then(result => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Sale created successfully',
                variant: 'success'
            }));
            if (isSaveAndNew) this.resetForm();
            else this.handleCancel();
        })
        .catch(error => {
            console.error('FULL ERROR =>', JSON.stringify(error));
            let message = 'Something went wrong';
            if (error.body) {
                if (Array.isArray(error.body)) message = error.body.map(e => e.message).join(', ');
                else if (error.body.message) message = error.body.message;
            }
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            }));
        });
    }

    resetForm() {
        this.customerId = '';
        this.saleDate = null;
        this.saleItems = [];
        this.addSaleItem();
    }

    calculateRowTotal(index) {
    const item = this.saleItems[index];
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    item.total = qty * price;
}


get grandTotal() {
    return this.saleItems.reduce((sum, item) => {
        return sum + (Number(item.total) || 0);
    }, 0);
}


}





