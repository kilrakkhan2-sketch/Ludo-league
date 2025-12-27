# Admin Dashboard: UI Structure & Wireframe

This document outlines the UI structure for the deposit management section of the admin dashboard.

**Framework:** React / Next.js with a component library like ShadCN/UI or MUI.

---

## 1. Main Layout

A standard admin layout with a sidebar for navigation and a main content area.

- **Sidebar:**
    - Dashboard
    - Users
    - **Deposits** (Active Link)
    - Withdrawals
    - Settings

- **Main Content Area:**
    - **Title:** "Deposit Management"
    - **Tabs:** To filter requests by status.
        - `Pending` (Default)
        - `Approved`
        - `Rejected`

---

## 2. Pending Deposits Tab (The Main Workspace)

This is where the admin will spend most of their time. It should be a data table that is easy to scan.

**Component:** `<PendingDepositsTable />`

### Table Columns:

| Column Header   | Component/Data          | Description                                                                                                   |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User**        | `<UserHoverCard />`     | Displays `userId` and maybe the user's name. On hover, shows key stats like total deposits, account age, etc. |
| **Amount**      | `<span>`                | The requested deposit amount. e.g., `₹500`.                                                                   |
| **UTR**         | `<span>` & `ClipboardCopy` | The UTR number provided by the user. A button to copy the UTR is essential for quick verification.            |
| **Screenshot**  | `<ScreenshotModal />`   | A button or link that opens the `screenshotUrl` in a modal dialog for easy viewing.                           |
| **Request Age** | `<TimeAgo />`           | Shows how long ago the request was created (e.g., "5 minutes ago", "2 hours ago"). Helps prioritize.          |
| **Risk**        | `<RiskBadge />`         | (Optional but Recommended) A badge indicating the calculated `riskScore`. (e.g., `Low`, `Medium`, `High`).       |
| **Actions**     | `<ActionButtons />`     | The Approve and Reject buttons.                                                                               |

### Action Buttons Component (`<ActionButtons />`):
-   **Approve Button:**
    -   Color: Green (`success`)
    -   Icon: `CheckCircle`
    -   Action: Triggers the `approveDeposit` function.
    -   State: Becomes disabled after being clicked to prevent double actions.

-   **Reject Button:**
    -   Color: Red (`destructive`)
    -   Icon: `XCircle`
    -   Action: Opens the `<RejectReasonDialog />`.
    -   State: Becomes disabled after being clicked.


---

## 3. Supporting Components

### `<RejectReasonDialog />`
-   **Triggered by:** Clicking the "Reject" button.
-   **Content:**
    -   A title: "Reject Deposit?"
    -   A text area or input field for `adminNote` (the reason for rejection).
    -   A dropdown with common rejection reasons can speed up the process.
    -   A final "Confirm Rejection" button.

### `<ScreenshotModal />`
-   **Triggered by:** Clicking the screenshot link/button.
-   **Content:**
    -   Displays the image from `screenshotUrl` in a large, clear view.
    -   Allows the admin to zoom or open the image in a new tab.

### `<UserHoverCard />`
-   **Triggered by:** Hovering over the user ID.
-   **Content:**
    -   User's full name and phone number.
    -   `isBlocked` status.
    -   Total wallet balance.
    -   Account creation date.

This structure provides a clear, efficient, and powerful interface for admins to manage deposits quickly.
