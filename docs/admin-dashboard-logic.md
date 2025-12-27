# Admin Dashboard: Deposit Approval/Rejection Logic

This document outlines the workflow and logic for an admin to approve or reject deposit requests from the admin dashboard.

**Objective:** To provide a secure, fast, and clear process for managing user deposits.

---

## 1. Fetching Pending Deposits

The primary view of the deposit management panel will be a list of all deposits with the `status` of `pending`.

- **Query:** Fetch all documents from the `deposits` collection where `status == 'pending'`. 
- **Sort Order:** Display the oldest requests first (`createdAt` ascending) to ensure FIFO (First-In, First-Out).
- **Real-time Updates:** Use a real-time listener (like Firestore's `onSnapshot`) to update the list automatically as new requests come in.

---

## 2. Information Display

For each pending deposit, the admin dashboard should clearly display all necessary information:

- **User ID:** `userId` (Clickable to view user's profile/history).
- **Amount:** `amount`.
- **UTR:** `utr`.
- **Screenshot:** A link or thumbnail to view the `screenshotUrl`.
- **Request Time:** `createdAt` (formatted to a readable string, e.g., "10 minutes ago").
- **Auto-Check Flags (Optional):**
    - 🚩 **Duplicate UTR:** A warning if this UTR has been seen before (even in rejected requests).
    - 🚩 **Amount Mismatch:** A flag if the detected amount from a payment gateway (if integrated) doesn't match the user-entered amount.
    - 🚩 **Time Window:** A notice if the request was submitted more than 15 minutes after the payment time.

---

## 3. The Approval Workflow

When the admin clicks the **"Approve"** button:

1.  **Initiate an Atomic Batch Write:** To ensure data integrity, all database operations should be bundled into a single atomic transaction. If one step fails, all steps are rolled back.

2.  **Update Deposit Status:**
    -   Set the `status` of the document in the `deposits` collection to `approved`.
    -   Set the `updatedAt` field to the current server timestamp.

3.  **Credit User's Wallet:**
    -   Atomically increment the `walletBalance` field in the corresponding document in the `users` collection. Use `FieldValue.increment(approvedAmount)`.

4.  **Create Transaction Record:**
    -   Create a new document in the `transactions` collection:
        -   `userId`: The user's ID.
        -   `type`: 'deposit'
        -   `amount`: The approved amount (as a positive number).
        -   `timestamp`: Current server timestamp.
        -   `status`: 'completed'
        -   `details`: A map like `{ "sourceDepositId": "[DOCUMENT_ID_OF_DEPOSIT]" }`.

5.  **Commit the Batch:** Execute the atomic write.

6.  **Send Notification:** (Post-commit) Trigger a function or service to send an in-app or push notification to the user confirming the deposit.

---

## 4. The Rejection Workflow

When the admin clicks the **"Reject"** button:

1.  **Prompt for Reason:** A modal or dialog should appear, requiring the admin to select a predefined reason or enter a custom one (e.g., "Incorrect UTR", "Amount Mismatch", "Invalid Screenshot"). This is crucial for user feedback.

2.  **Update Deposit Status:**
    -   Set the `status` of the document in the `deposits` collection to `rejected`.
    -   Set the `rejectionReason` field with the reason provided by the admin.
    -   Set the `updatedAt` field to the current server timestamp.

3.  **Do NOT update the wallet balance.**

4.  **Send Notification:** Trigger a notification to the user explaining that the deposit was rejected and providing the reason. This helps reduce support queries.

---

## 5. Security & Best Practices

-   **Admin Authentication:** The entire dashboard must be protected by robust admin authentication and authorization rules.
-   **Idempotency:** The system should be designed to prevent accidental double-crediting if an admin clicks "Approve" twice. Using Firestore's atomic transactions and checking the document's state before updating helps achieve this.
-   **Logging:** All admin actions (approvals, rejections) should be logged for security and auditing purposes.
