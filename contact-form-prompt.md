### Prompt for AI Agent:

Your task is to create a complete, production-ready React contact form component using TypeScript and Tailwind CSS. This prompt contains all the information you need; no prior knowledge of any specific backend is required.

**Component Name:** `ContactForm.tsx`

---

### **1. Setup & Configuration**

Before creating the component, you need to set up environment variables. Create a `.env.local` file in the root of your project and add the following variables. Replace the placeholder values with the actual credentials for the API.

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_TENANT_ID=your-tenant-id
NEXT_PUBLIC_API_KEY=your-public-api-key
```

---

### **2. Core Component Requirements**

**Fields:** The form must include the following fields:
*   Full Name (text input)
*   Email Address (email input)
*   Message (textarea)
*   A "Submit" button.

**Styling:**
*   Style the component using **Tailwind CSS**.
*   The layout should be clean, modern, and responsive.
*   Provide clear labels for each input.
*   The submit button should be visually distinct.

**State and Validation:**
*   Use React hooks (`useState`) to manage the state of each form input.
*   Implement client-side validation:
    *   All fields are required.
    *   The email field must be a valid email format.
*   Display clear, user-friendly validation error messages next to the corresponding fields when validation fails.

---

### **3. API Submission Logic**

When the user clicks "Submit" and validation passes, the component must send the form data to a backend API.

**TypeScript Type Definition:**
First, define the shape of the data you will send. You can place this inside your component file or in a separate types file.

```typescript
interface FormEntryPayload {
  formId: string;
  formData: {
    name: string;
    email: string;
    message: string;
  };
}
```

**API Call Details:**
*   **Method:** `POST`
*   **Endpoint URL:** The full URL is constructed from your environment variables:
    `${process.env.NEXT_PUBLIC_API_URL}/api/forms/${process.env.NEXT_PUBLIC_TENANT_ID}/entries`
*   **Authentication:** The request must include an `Authorization` header with a bearer token.
    *   `Authorization: Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
*   **Headers:**
    *   `Content-Type: application/json`
*   **Request Body:** The body of the POST request must be a JSON-stringified object matching the `FormEntryPayload` interface. The `formId` should be hardcoded to `"contact-us"`.
    ```json
    {
      "formId": "contact-us",
      "formData": {
        "name": "...",
        "email": "...",
        "message": "..."
      }
    }
    ```

---

### **4. User Feedback and State Handling**

*   Manage the form's submission state (e.g., 'idle', 'submitting', 'success', 'error').
*   While submitting, disable the submit button and show a visual loading indicator (like a spinner).
*   On a **successful** API response (e.g., HTTP 200-299), hide the form and display a clear "Thank you for your message!" confirmation.
*   If the API returns an **error** (e.g., HTTP 400-599), display a generic error message to the user (e.g., "Something went wrong. Please try again.") without clearing the form fields.

---

Please provide the complete code for the `ContactForm.tsx` component in a single file.
