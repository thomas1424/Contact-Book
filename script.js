document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const createContactBtn = document.getElementById('createContactBtn');
    const searchInput = document.getElementById('searchInput');
    const contactList = document.getElementById('contactList');
    const contactCountSpan = document.getElementById('contactCount');
    const noContactsMessage = document.getElementById('no-contacts-message');

    // Modals & Overlay
    const contactDetailModal = document.getElementById('contactDetailModal');
    const contactFormModal = document.getElementById('contactFormModal');
    const modalOverlay = document.getElementById('modalOverlay');

    // Detail Modal Elements
    const detailAvatar = document.getElementById('detailAvatar');
    const detailName = document.getElementById('detailName');
    const detailEmail = document.getElementById('detailEmail');
    const detailPhone = document.getElementById('detailPhone');
    const detailStatusMessage = document.getElementById('detailStatusMessage');
    const editContactBtn = document.getElementById('editContactBtn');
    const deleteContactBtn = document.getElementById('deleteContactBtn');

    // Form Modal Elements
    const contactForm = document.getElementById('contactForm');
    const formTitle = document.getElementById('formTitle');
    const contactIdInput = document.getElementById('contactId');
    const nameInput = document.getElementById('nameInput');
    const phoneInput = document.getElementById('phoneInput');
    const emailInput = document.getElementById('emailInput');
    const formAvatar = document.getElementById('formAvatar'); // Avatar in the form
    const formStatusMessage = document.getElementById('formStatusMessage');
    const phoneError = document.getElementById('phoneError');
    const emailError = document.getElementById('emailError');
    const saveButton = document.getElementById('saveButton');
    // Get cancel buttons for form modal
    const cancelFormBtns = document.querySelectorAll('.cancel-form-btn');

    // --- State ---
    let contacts = [];
    let currentContactId = null; // To track which contact is being viewed/edited

    // --- Avatar Generation ---
    const avatarColors = [
        '#d81b60', '#8e24aa', '#1e88e5', '#00897b', '#43a047',
        '#f4511e', '#546e7a', '#ffb300', '#5d4037', '#e53935'
    ];

    function getInitials(name) {
        if (!name) return '?';
        const nameParts = name.trim().split(' ');
        if (nameParts.length === 1) {
            return nameParts[0].charAt(0).toUpperCase();
        }
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    }

    function getAvatarColor(name) {
        if (!name) return avatarColors[0];
        // Simple hash function to get a somewhat consistent color based on name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convert to 32bit integer
        }
        const index = Math.abs(hash) % avatarColors.length;
        return avatarColors[index];
    }

    function renderAvatar(element, name) {
        const initials = getInitials(name);
        const color = getAvatarColor(name);
        element.textContent = initials;
        element.style.backgroundColor = color;
    }

    // --- Utility Functions --- (Keep generateUUID, validations)
    function generateUUID() { /* ... keep existing ... */
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
     }
    function validatePhone(phone) { /* ... keep existing ... */
        if (!phone) return true;
        const phoneRegex = /^[+\d()-\s]{5,20}$/;
        return phoneRegex.test(phone);
     }
    function validateEmail(email) { /* ... keep existing ... */
        if (!email) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    function clearValidationErrors() { /* ... keep existing ... */
        phoneError.textContent = '';
        emailError.textContent = '';
        phoneInput.classList.remove('invalid');
        emailInput.classList.remove('invalid');
    }
    function displayValidationError(element, errorElement, message) { /* ... keep existing ... */
        errorElement.textContent = message;
        // element.classList.add('invalid'); // Optional styling not added in this CSS version
     }
    // Status message helper
    function showStatus(element, message, isError = false, duration = 3000) {
        element.textContent = message;
        element.className = `status-message active ${isError ? 'status-error' : 'status-success'}`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'status-message';
        }, duration);
    }


    // --- Local Storage ---
    function loadContactsFromStorage() {
        const storedContacts = localStorage.getItem('contacts_v2'); // Use new key for new structure if needed
        try {
            contacts = storedContacts ? JSON.parse(storedContacts) : [];
             if (!Array.isArray(contacts)) contacts = [];
        } catch (e) {
            console.error("Error parsing contacts:", e);
            contacts = [];
        }
        displayContacts();
    }

    function saveContactsToStorage() {
        try {
            localStorage.setItem('contacts_v2', JSON.stringify(contacts));
        } catch (e) {
            console.error("Error saving contacts:", e);
            // Maybe show a persistent error message in the UI
        }
    }

    // --- Modal Management ---
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modalOverlay.classList.add('active');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            // Only hide overlay if no other modals are active (though usually only one is open)
            const anyActiveModal = document.querySelector('.modal.active');
            if (!anyActiveModal) {
                 modalOverlay.classList.remove('active');
            }
        }
    }

    // Close modal via overlay click or close button
    function handleCloseModal(event) {
         // Check if clicked on overlay itself or a close button
         if (event.target === modalOverlay || event.target.closest('.modal-close-btn') || event.target.closest('.cancel-form-btn')) {
            const modalId = event.target.dataset.modalId || event.target.closest('[data-modal-id]')?.dataset.modalId;
             if(modalId) {
                 closeModal(modalId);
             } else if (event.target === modalOverlay) {
                 // Close any active modal if overlay is clicked directly
                 document.querySelectorAll('.modal.active').forEach(m => closeModal(m.id));
             }
        }
    }

    // --- UI Rendering ---
    function displayContacts(filteredContacts = null) {
        contactList.innerHTML = ''; // Clear list
        const contactsToDisplay = filteredContacts !== null ? filteredContacts : contacts;

        contactsToDisplay.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        contactCountSpan.textContent = contacts.length; // Update total count in sidebar

        if (contactsToDisplay.length === 0) {
            contactList.innerHTML = '<li class="empty-message">No contacts found.</li>';
        } else {
            contactsToDisplay.forEach(contact => {
                const li = document.createElement('li');
                li.className = 'contact-list-item';
                li.setAttribute('data-id', contact.id);

                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'contact-avatar';
                renderAvatar(avatarDiv, contact.name);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'contact-name';
                nameSpan.textContent = contact.name;

                const emailSpan = document.createElement('span');
                emailSpan.className = 'contact-email';
                emailSpan.textContent = contact.email || '-'; // Display dash if empty

                const phoneSpan = document.createElement('span');
                phoneSpan.className = 'contact-phone';
                phoneSpan.textContent = contact.phone || '-'; // Display dash if empty

                // Actions (only visible on hover in desktop view via CSS)
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'contact-item-actions';
                 // Optional: Add quick edit/delete buttons here if desired for list view too
                 // actionsDiv.innerHTML = `
                 //    <button class="icon-btn quick-edit-btn" title="Edit"><span class="material-icons">edit</span></button>
                 //    <button class="icon-btn quick-delete-btn" title="Delete"><span class="material-icons">delete</span></button>
                 // `;


                li.appendChild(avatarDiv);
                 // On smaller screens, stack name/email/phone
                 if (window.innerWidth <= 900) {
                    const infoStack = document.createElement('div');
                    infoStack.className = 'contact-info-stack';
                    infoStack.appendChild(nameSpan);
                    infoStack.appendChild(emailSpan); // Or phone, depending on what's more important
                     li.appendChild(infoStack);
                 } else {
                     li.appendChild(nameSpan);
                     li.appendChild(emailSpan);
                     li.appendChild(phoneSpan);
                 }

                li.appendChild(actionsDiv); // Add empty actions container for spacing or future buttons

                // Add click listener to open detail view
                li.addEventListener('click', (e) => {
                     // Prevent opening detail if a button inside the item was clicked
                    if (e.target.closest('button')) return;
                    openDetailModal(contact.id);
                });

                contactList.appendChild(li);
            });
        }
         // Show/hide the main "empty" message based on *total* contacts
         noContactsMessage.style.display = contacts.length === 0 ? 'block' : 'none';
    }


    // --- Modal Population & Actions ---
    function openDetailModal(contactId) {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) return;

        currentContactId = contactId; // Store ID for actions

        renderAvatar(detailAvatar, contact.name);
        detailName.textContent = contact.name;
        detailEmail.textContent = contact.email || 'No email added';
        detailPhone.textContent = contact.phone || 'No phone number added';

        // Ensure status message is clear initially
        detailStatusMessage.textContent = '';
        detailStatusMessage.className = 'status-message';

        openModal('contactDetailModal');
    }

     function openFormModal(mode = 'add', contactId = null) {
        resetForm(); // Clear previous state
        currentContactId = contactId; // Store ID if editing

        if (mode === 'edit' && contactId) {
            const contact = contacts.find(c => c.id === contactId);
            if (!contact) return; // Should not happen if called correctly

            formTitle.textContent = 'Edit contact';
            saveButton.textContent = 'Update';
            contactIdInput.value = contact.id; // Set hidden ID field
            nameInput.value = contact.name;
            phoneInput.value = contact.phone || '';
            emailInput.value = contact.email || '';
            renderAvatar(formAvatar, contact.name); // Update form avatar too
        } else {
            // Add mode (default)
            formTitle.textContent = 'Create contact';
            saveButton.textContent = 'Save';
            renderAvatar(formAvatar, ''); // Render default/placeholder avatar
        }
         formStatusMessage.textContent = ''; // Clear status
        openModal('contactFormModal');
        nameInput.focus(); // Focus name field
    }

    // --- Form Handling ---
    function resetForm() {
        contactForm.reset();
        contactIdInput.value = '';
        currentContactId = null;
        clearValidationErrors();
        formStatusMessage.textContent = '';
        formStatusMessage.className = 'status-message';
        renderAvatar(formAvatar, ''); // Reset avatar
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        clearValidationErrors();

        const id = contactIdInput.value; // Will be empty if adding
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();

        let isValid = true;
        if (!name) {
            // Should be caught by 'required', but double-check
            showStatus(formStatusMessage, "Name is required.", true);
            isValid = false;
        }
         if (phone && !validatePhone(phone)) {
            displayValidationError(phoneInput, phoneError, "Invalid phone format.");
            isValid = false;
        }
        if (email && !validateEmail(email)) {
             displayValidationError(emailInput, emailError, "Invalid email format.");
            isValid = false;
        }

        if (!isValid) return;

        const isEditing = !!id;

        if (isEditing) {
            const index = contacts.findIndex(c => c.id === id);
            if (index > -1) {
                contacts[index] = { ...contacts[index], name, phone, email }; // Preserve other potential fields
                 showStatus(formStatusMessage, "Contact updated.", false);
            } else {
                 showStatus(formStatusMessage, "Error: Contact not found.", true);
                 return; // Stop if contact vanished somehow
            }
        } else {
            const newContact = { id: generateUUID(), name, phone, email };
            contacts.push(newContact);
             showStatus(formStatusMessage, "Contact created.", false);
        }

        saveContactsToStorage();
        displayContacts(); // Refresh list in the background

        // Close form modal after a short delay to show success message
        setTimeout(() => {
            closeModal('contactFormModal');
            // If we were editing, refresh the detail view if it's open for the same contact
            if (isEditing && contactDetailModal.classList.contains('active') && currentContactId === id) {
                openDetailModal(id); // Re-open detail modal with updated info
            }
        }, 1000); // 1 second delay
    }

    // --- Delete Action ---
    function handleDeleteContact() {
        if (!currentContactId) return; // Should have an ID from detail view

        const contact = contacts.find(c => c.id === currentContactId);
        if (!contact) return;

        if (confirm(`Delete ${contact.name}? This contact will be removed permanently.`)) {
            contacts = contacts.filter(c => c.id !== currentContactId);
            saveContactsToStorage();
            displayContacts();
            closeModal('contactDetailModal'); // Close detail view after delete
             showStatus(detailStatusMessage, `Contact ${contact.name} deleted.`, false, 5000); // Show status briefly where detail was
            currentContactId = null; // Clear tracked ID
        }
    }

    // --- Search ---
     function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            displayContacts(); // Show all if query is empty
            return;
        }
        const filtered = contacts.filter(contact =>
            contact.name.toLowerCase().includes(query) ||
            (contact.phone && contact.phone.toLowerCase().includes(query)) ||
            (contact.email && contact.email.toLowerCase().includes(query))
        );
        displayContacts(filtered);
    }


    // --- Event Listeners ---
    createContactBtn.addEventListener('click', () => openFormModal('add'));
    searchInput.addEventListener('input', handleSearch);

    // Modal closing listeners
    modalOverlay.addEventListener('click', handleCloseModal);
    document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', handleCloseModal));
     cancelFormBtns.forEach(btn => btn.addEventListener('click', handleCloseModal));

    // Detail modal action listeners
    editContactBtn.addEventListener('click', () => {
        if (currentContactId) {
            closeModal('contactDetailModal'); // Close detail modal first
            openFormModal('edit', currentContactId); // Open form modal in edit mode
        }
    });
    deleteContactBtn.addEventListener('click', handleDeleteContact);

    // Form submission
    contactForm.addEventListener('submit', handleFormSubmit);

    // --- Initial Load ---
    loadContactsFromStorage();

}); // End DOMContentLoaded
