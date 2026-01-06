
import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import savePurchaseWithItems from '@salesforce/apex/PurchaseController.savePurchaseWithItems';
import getSuppliers from '@salesforce/apex/PurchaseController.getSuppliers';
import getMedicines from '@salesforce/apex/PurchaseController.getMedicines';

export default class PurchaseForm extends NavigationMixin(LightningElement) {

    // Purchase Fields
    @track supplierId = '';
    @track purchaseDate = null;

    // Purchase Item Fields
    @track purchaseItems = [];

    // Options
    @track supplierOptions = [];
    @track medicineOptions = [];


    connectedCallback() {
        try {
            this.purchaseItems = [];
            this.addPurchaseItem();
            console.log('connectedCallback OK, initial purchaseItems:', this.purchaseItems);
        } catch (e) {
            console.error('connectedCallback error', e);
        }
    }

    // Load Suppliers
    @wire(getSuppliers)
    wiredSuppliers({data, error}) {
        if(data) {
            this.supplierOptions = data;
            console.log('Suppliers loaded:', this.supplierOptions);
        }
        if(error) console.error('Error loading suppliers:', error);
    }

    // Load Medicines
    @wire(getMedicines)
    wiredMedicines({data, error}) {
        if(data) {
            this.medicineOptions = data;
            console.log('Medicines loaded:', this.medicineOptions);
        }
        if(error) console.error('Error loading medicines:', error);
    }

    // Purchase field handlers
    handleSupplierChange(event){ 
        this.supplierId = event.detail.value; 
        console.log('Supplier selected:', this.supplierId);
    }
    handleDateChange(event){ 
        this.purchaseDate = event.target.value; 
        console.log('Purchase Date selected:', this.purchaseDate);
    }

    // Purchase Items handlers
    handleItemChange(event) {
        const index = event.target.dataset.index;
        const field = event.target.dataset.field;
        this.purchaseItems[index][field] = event.detail.value;
        console.log(`Item changed at index ${index}, field ${field}:`, this.purchaseItems[index]);
    }

    addPurchaseItem() {
        const newItem = {
            id: Date.now() + Math.random(), // Salesforce-safe unique key
            medicineId: '',
            quantity: null,
            costPrice: null
        };
        this.purchaseItems = [...this.purchaseItems, newItem];
        console.log('Added new purchase item:', newItem, 'Current items:', this.purchaseItems);
    }

    removePurchaseItem(event) {
        const index = event.target.dataset.index;
        console.log('Removing item at index:', index, 'Current items before removal:', this.purchaseItems);
        this.purchaseItems.splice(index,1);
        this.purchaseItems = [...this.purchaseItems]; // refresh UI
        console.log('Current items after removal:', this.purchaseItems);
    }

    handleSave() { 
        
        console.log('Save button clicked');
        this.saveRecord(false); 
    }
    handleSaveAndNew() { 
        console.log('Save & New button clicked');
        this.saveRecord(true); 
    }
    handleCancel() { 
        console.log('Cancel button clicked');
        this.navigateToPurchaseList(); 
    }

    saveRecord(isSaveAndNew){
        console.log('Preparing to save record. Supplier:', this.supplierId, 'Date:', this.purchaseDate, 'Items:', this.purchaseItems);
        
   



        savePurchaseWithItems({
            supplierId: this.supplierId,
            purchaseDate: this.purchaseDate,
            items: this.purchaseItems
        })
        .then((purchaseId)=>{
            console.log('Purchase saved successfully, ID:', purchaseId);
            this.dispatchEvent(new ShowToastEvent({
                title:'Success',
                message:'Purchase created successfully',
                variant:'success'
            }));
            


            
            
            if(isSaveAndNew){
                this.resetForm();
            }else {
            // Navigate to the newly created record
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: purchaseId,
                    objectApiName: 'Purchase__c', // Your object API name
                    actionName: 'view'
                }
            });
        }
        })
        .catch(error => {
            console.error('FULL ERROR =>', JSON.stringify(error));

            let message = 'Something went Wrong';

            if (error.body) {
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (error.body.message) {
                    message = error.body.message;
                }
            }

            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            }));
        });
    }

    resetForm(){
        console.log('Resetting form');
        this.supplierId = '';
        this.purchaseDate = null;
        this.purchaseItems = [];
        this.addPurchaseItem();
        console.log('Form reset. Current items:', this.purchaseItems);
    }

    navigateToPurchaseList(){
        console.log('Navigating to Purchase list page');
        this[NavigationMixin.Navigate]({
            type:'standard__objectPage',
            attributes:{ objectApiName:'Purchase__c', actionName:'list' },
            state:{ filterName:'Recent' }
        });
    }
   @track showNewMedicineModal = false;
@track newMedicineIndex = null;

handleNewMedicineClick(event) {
    // store which row triggered the modal
    this.newMedicineIndex = event.target.dataset.index;
    this.showNewMedicineModal = true;
}
handleMedicineSaved(event) {
    const { id, name } = event.detail;

    // Add new medicine to combobox options
    this.medicineOptions = [...this.medicineOptions, { label: name, value: id }];

    // Select this medicine for the row that opened the modal
    if (this.newMedicineIndex !== null) {
        this.purchaseItems[this.newMedicineIndex].medicineId = id;
        this.purchaseItems = [...this.purchaseItems];
    }

    // Close the modal
    this.showNewMedicineModal = false;
    this.newMedicineIndex = null;
}

handleCancelNewMedicine() {
    this.showNewMedicineModal = false;
    this.newMedicineIndex = null;
}


}
