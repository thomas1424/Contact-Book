// Wait for the DOM to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const contactForm = document.getElementById('contactForm');
    const contactList = document.getElementById('contactList');
    const searchInput = document.getElementById('searchInput');
    const nameInput = document.getElementById('nameInput');
    const phoneInput = document.getElementById('phoneInput');
    const emailInput = document.getElementById('emailInput');
    const contactIdInput = document.getElementById('contactId'); // Hidden input for editing
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    const formTitle = document.getElementById('form-title');
    const noContactsMessage = document.getElementById('no-contacts-message');
    const statusMessage = document.getElementById('statusMessage');
    const phoneError = document.getElementById('phoneError');
    const emailError = document.getElementById('emailError');

    // --- State ---
    let contacts = []; // Array to hold contact objects
    let isEditing = false; // Flag to track if the form is in edit mode

    // --- Utility Functions ---

    // Basic UUID generator (for unique IDs)
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Load contacts from localStorage
    function loadContactsFromStorage() {
        const storedContacts = localStorage.getItem('contacts');
        if (storedContacts) {
            try {
                contacts = JSON.parse(storedContacts);
                 // Ensure it's an array
                 if (!Array.isArray(contacts)) {
                    console.error("Stored contacts data is not an array. Resetting.");
                    contacts = [];
                    saveContactsToStorage(); // Clear invalid storage
                }
            } catch (e) {
                console.error("Error parsing contacts from localStorage:", e);
                contacts = []; // Reset if parsing fails
                saveContactsToStorage(); // Clear invalid storage
            }
        } else {
            contacts = []; // Initialize if nothing is stored
        }
        displayContacts(); // Display initially loaded contacts
    }

    // Save contacts to localStorage
    function saveContactsToStorage() {
        try {
            localStorage.setItem('contacts', JSON.stringify(contacts));
        } catch (e) {
            console.error("Error saving contacts to localStorage:", e);
            showStatusMessage("Error saving contacts. Storage might be full.", true);
        }
    }

    // Basic Phone Validation (allows digits, -, spaces, (), +)
    function validatePhone(phone) {
        if (!phone) return true; // Allow empty phone number
        // More permissive regex to allow common formats and international numbers
        const phoneRegex = /^[+\d()-\s]{5,20}$/;
        return phoneRegex.test(phone);
    }

     // Basic Email Validation
    function validateEmail(email) {
        if (!email) return true; // Allow empty email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Display status messages to the user
    function showStatusMessage(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${isError ? 'status-error' : 'status-success'}`;
        // Clear message after a few seconds
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        }, 4000);
    }

    // Clear validation error messages
    function clearValidationErrors() {
        phoneError.textContent = '';
        emailError.textContent = '';
        phoneInput.classList.remove('invalid');
        emailInput.classList.remove('invalid');
    }

     // Display validation errors
    function displayValidationError(element, errorElement, message) {
        errorElement.textContent = message;
        element.classList.add('invalid'); // Optional: add style for invalid input
    }

    // --- Core Logic Functions ---

    // Render the contact list in the UI
    function displayContacts(filteredContacts = null) {
        contactList.innerHTML = ''; // Clear existing list items
        const contactsToDisplay = filteredContacts !== null ? filteredContacts : contacts;

        // Sort contacts alphabetically by name (case-insensitive)
        contactsToDisplay.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        if (contactsToDisplay.length === 0) {
            if (filteredContacts !== null) {
                // Show message specific to search results
                 contactList.innerHTML = '<li class="empty-message">No contacts match your search.</li>';
            } else {
                 // Show the default empty message
                 contactList.appendChild(noContactsMessage);
                 noContactsMessage.style.display = 'block';
            }

        } else {
             noContactsMessage.style.display = 'none'; // Hide default empty message
             contactsToDisplay.forEach(contact => {
                const li = document.createElement('li');
                li.setAttribute('data-id', contact.id); // Store ID on the element

                li.innerHTML = `
                    <div class="contact-details">
                        <strong><i class="fas fa-user-circle"></i> ${contact.name}</strong>
                        ${contact.phone ? `<span><i class="fas fa-phone-alt"></i> ${contact.phone}</span>` : ''}
                        ${contact.email ? `<span><i class="fas fa-at"></i> ${contact.email}</span>` : ''}
                    </div>
                    <div class="contact-actions">
                        <button class="btn btn-warning edit-btn"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-danger delete-btn"><i class="fas fa-trash-alt"></i> Delete</button>
                    </div>
                `;
                contactList.appendChild(li);
            });
        }
    }

    // Reset the form to its initial state (for adding)
    function resetForm() {
        contactForm.reset(); // Clears all input fields
        contactIdInput.value = ''; // Clear hidden ID field
        isEditing = false;
        formTitle.innerHTML = '<i class="fas fa-user-plus"></i> Add New Contact';
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Contact';
        cancelButton.style.display = 'none'; // Hide cancel button
        clearValidationErrors();
        // statusMessage.textContent = ''; // Optionally clear status on reset
    }

    // Populate the form with contact data for editing
    function populateFormForEdit(contact) {
        contactIdInput.value = contact.id;
        nameInput.value = contact.name;
        phoneInput.value = contact.phone || ''; // Handle potentially null/undefined values
        emailInput.value = contact.email || '';
        isEditing = true;
        formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Contact';
        saveButton.innerHTML = '<i class="fas fa-check"></i> Update Contact';
        cancelButton.style.display = 'inline-block'; // Show cancel button
        clearValidationErrors();
        nameInput.focus(); // Focus on the name field for editing
    }

    // Handle form submission (Add or Edit)
    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default page reload
        clearValidationErrors(); // Clear previous errors

        const id = contactIdInput.value;
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();

        // --- Input Validation ---
        let isValid = true;
        if (!name) {
            // Name is required by the HTML 'required' attribute, but good to double-check
            showStatusMessage("Name is required.", true);
            isValid = false;
            // In a real app, you might add visual feedback to the name input too
        }
        if (phone && !validatePhone(phone)) {
            displayValidationError(phoneInput, phoneError, "Invalid phone number format.");
            isValid = false;
        }
         if (email && !validateEmail(email)) {
            displayValidationError(emailInput, emailError, "Invalid email address format.");
            isValid = false;
        }

        if (!isValid) {
            showStatusMessage("Please correct the errors in the form.", true);
            return; // Stop submission if validation fails
        }
        // --- End Validation ---


        if (isEditing && id) {
            // --- Update existing contact ---
            const contactIndex = contacts.findIndex(c => c.id === id);
            if (contactIndex > -1) {
                contacts[contactIndex] = { id, name, phone, email };
                showStatusMessage("Contact updated successfully!");
            } else {
                showStatusMessage("Error: Contact not found for update.", true);
            }
        } else {
            // --- Add new contact ---
            const newContact = {
                id: generateUUID(), // Generate a unique ID
                name,
                phone,
                email
            };
            contacts.push(newContact);
            showStatusMessage("Contact added successfully!");
        }

        saveContactsToStorage(); // Save changes to localStorage
        displayContacts();     // Refresh the displayed list
        resetForm();           // Clear the form
    }

    // Handle clicks on the contact list (for Edit/Delete buttons - Event Delegation)
    function handleListClick(event) {
        const target = event.target;
        const listItem = target.closest('li'); // Find the parent list item
        if (!listItem) return; // Click wasn't inside a list item

        const contactId = listItem.getAttribute('data-id');

        // Handle Edit Button Click
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
            const contactToEdit = contacts.find(c => c.id === contactId);
            if (contactToEdit) {
                populateFormForEdit(contactToEdit);
                // Scroll form into view smoothly (optional)
                 contactForm.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Handle Delete Button Click
        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            const contactToDelete = contacts.find(c => c.id === contactId);
            if (contactToDelete) {
                // Confirmation dialog
                if (confirm(`Are you sure you want to delete ${contactToDelete.name}?`)) {
                    contacts = contacts.filter(c => c.id !== contactId); // Remove contact from array
                    saveContactsToStorage();
                    displayContacts();
                    showStatusMessage(`Contact '${contactToDelete.name}' deleted.`);
                     // If the deleted contact was being edited, reset the form
                    if (isEditing && contactIdInput.value === contactId) {
                        resetForm();
                    }
                }
            }
        }
    }

    // Handle search input changes
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query === '') {
            displayContacts(); // Show all contacts if search is cleared
            return;
        }

        const filtered = contacts.filter(contact => {
            const nameMatch = contact.name.toLowerCase().includes(query);
            const phoneMatch = contact.phone && contact.phone.toLowerCase().includes(query);
            const emailMatch = contact.email && contact.email.toLowerCase().includes(query);
            return nameMatch || phoneMatch || emailMatch;
        });

        displayContacts(filtered); // Display only filtered results
    }

    // --- Event Listeners ---
    contactForm.addEventListener('submit', handleFormSubmit);
    contactList.addEventListener('click', handleListClick); // Use event delegation
    searchInput.addEventListener('input', handleSearch); // Real-time search as user types
    cancelButton.addEventListener('click', resetForm);

    // --- Initial Load ---
    loadContactsFromStorage(); // Load data and display contacts when the page loads

}); // End DOMContentLoaded
