# Web-Based Contact Book (Client-Side)

A simple web application to manage contacts (add, view, search, edit, delete) using a browser interface.

**This version runs entirely in your web browser.** It uses HTML for structure, CSS for styling, and JavaScript for logic and interactivity. **Contact data is stored locally in your browser's `localStorage`.** This means the data is persistent on your computer for that specific browser, but it is not stored on a server and won't be accessible from other devices or browsers unless manually transferred.

This application is designed to be hosted on static web hosting services like **GitHub Pages**.

## Features

* **Add Contact:** Add new contacts with Name (required), Phone (optional), and Email (optional).
* **View All Contacts:** Display all saved contacts, sorted alphabetically by name.
* **Search Contacts:** Real-time search for contacts by partially matching Name, Phone, or Email (case-insensitive).
* **Edit Contact:** Update the details of an existing contact. Click 'Edit', modify details in the form, and click 'Update Contact'.
* **Delete Contact:** Remove a contact with a confirmation step.
* **Local Data Persistence:** Contacts are saved in the browser's `localStorage`.
* **Input Validation:** Basic checks for phone number and email formats. Name is required.
* **Clean UI:** A responsive, modern-looking interface styled with CSS.
* **No Backend Required:** Runs entirely client-side.

## How to Run

1.  **Download Files:** Get the `index.html`, `style.css`, and `script.js` files and place them in the same directory.
2.  **Open in Browser:** Simply open the `index.html` file in your web browser (e.g., Chrome, Firefox, Edge, Safari).

## How it Works (Client-Side Storage)

* **`localStorage`:** This is a web storage mechanism provided by browsers. It allows websites to store key-value pairs locally within the user's browser.
* **Persistence:** Data stored in `localStorage` persists even after the browser window is closed and reopened.
* **Limitations:**
    * **Browser/Device Specific:** Data is tied to the specific browser and user profile on a single computer. It's not automatically synced across devices.
    * **Storage Limit:** `localStorage` typically has a storage limit (around 5-10MB per origin), which is usually more than enough for a simple contact book.
    * **User Control:** Users can manually clear their browser's storage, which would delete all saved contacts for this application.
