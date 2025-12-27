# UPI Deposit System: Firestore Data Structure

Here is the proposed Firestore data structure for the semi-automatic UPI deposit system.

## `deposits` Collection

This collection will store each deposit request initiated by a user.

**Document ID:** Auto-generated unique ID.

| Field             | Type        | Description                                                                                             | Example                                |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `userId`          | `string`    | The UID of the user who made the request. Links to the `users` collection.                              | `abc123xyz`                            |
| `amount`          | `number`    | The amount the user intends to deposit.                                                                 | `500`                                  |
| `utr`             | `string`    | The 12-22 digit Unique Transaction Reference (UTR) number from the UPI payment. **Must be unique.**       | `234567890123`                         |
| `status`          | `string`    | The current status of the deposit. (`pending`, `approved`, `rejected`)                                  | `pending`                              |
| `screenshotUrl`   | `string`    | (Optional) URL to the uploaded payment screenshot stored in Firebase Storage.                         | `https://firebasestorage.googleapis.com/...` |
| `createdAt`       | `Timestamp` | Server timestamp when the document was created.                                                         | `December 10, 2023 at 10:30:00 PM UTC+5:30` |
| `updatedAt`       | `Timestamp` | Server timestamp for the last update.                                                                   | `December 10, 2023 at 10:35:00 PM UTC+5:30` |
| `rejectionReason` | `string`    | (Optional) A brief reason why the deposit was rejected by the admin.                                    | `Incorrect UTR`                        |
| `adminNotes`      | `string`    | (Optional) Internal notes for admins regarding this transaction.                                        | `User has a history of failed attempts.` |

### Firestore Rules for `deposits`:
- Writes should only be allowed by authenticated users for their own `userId`.
- UTR number should be unique. This can be enforced with a separate collection (`utrIndex`) or via a Cloud Function check before creation to prevent duplicates.
- Admin users should have read/write access to all documents.

---

## `users` Collection (Updates)

This is your existing `users` collection. We'll add/update the wallet balance here.

| Field           | Type     | Description                                               |
| --------------- | -------- | --------------------------------------------------------- |
| `walletBalance` | `number` | The user's current credited balance. Defaults to `0`.     |

### Logic:
- When a deposit is `approved`, a Cloud Function or backend logic should atomically increment this value. `FieldValue.increment(approvedAmount)`.

---

## `transactions` Collection

A detailed log for all wallet activities, providing a clear audit trail.

**Document ID:** Auto-generated unique ID.

| Field        | Type        | Description                                                                    | Example                                 |
| ------------ | ----------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| `userId`     | `string`    | The UID of the user involved in the transaction.                               | `abc123xyz`                             |
| `type`       | `string`    | The type of transaction (`deposit`, `withdrawal`, `match_fee`, `refund`, etc.) | `deposit`                               |
| `amount`     | `number`    | The value of the transaction. Positive for credits, negative for debits.       | `500`                                   |
| `timestamp`  | `Timestamp` | Server timestamp when the transaction was recorded.                            | `December 10, 2023 at 10:35:00 PM UTC+5:30` |
| `status`     | `string`    | `completed`, `failed`                                                          | `completed`                             |
| `details`    | `map`       | A map containing context-specific information.                                 | `{ "sourceDepositId": "dep12345" }`     |

This structure provides a robust and scalable foundation for the deposit system.
