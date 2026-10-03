# Mobile App & Dashboard Integration Guide: Recent Updates & Alignments

This document outlines the backend updates made to address client requirements, detailing the endpoints changed/added, how the app and admin dashboard must integrate with them, and the exact flow logic.

---

## 1. Delete Account Functionality (Super Admin & Mobile App)

### What Changed on the Backend:
1. **Super Admin User Deletion**:
   - `DELETE /super-admin/users/:userId`
   - `DELETE /super-admin/delete-account/:userId`
   - `DELETE /users/:id`
2. **User Self-Deletion (Mobile App)**:
   - `DELETE /users/me` (Authenticated with user Bearer token).
3. **Internal Cleanup Logic**:
   - When a user is deleted, their user account is soft-deleted (`isDeleted: true`, `isActive: false`, `fcmToken: []`).
   - If they are linked to a node in the Family Tree:
     - **Leaf Node (no children)**: The tree node is soft-deleted, and `totalMembers` on the tree is decremented.
     - **Node with Children**: The member node is retained to avoid breaking the family branch for descendants, but `linkedUser` is unlinked.
   - All active push tokens (`fcmToken`) are cleared to stop future notifications.

### What the Mobile App Should Do:
- Add a **"Delete Account"** option in User Settings / Profile (mandated by Apple App Store and Google Play).
- On click, show a confirmation modal.
- Call `DELETE /users/me` with the user's `Authorization: Bearer <token>`.
- On success: Clear local storage/cache (access token, user info) and navigate the user to the Login screen.

### What the Super Admin Dashboard Should Do:
- In the User Management table/screen, ensure there is a **"Delete Account"** button next to "Block / Unblock".
- When clicked, call `DELETE /super-admin/users/:userId`.
- On success, remove that user from the table or refresh the user list.

---

## 2. Mother Tree Mandate & User Directory

### What Changed on the Backend:
1. **Registration with Mother Tree in One Step**:
   - `POST /auth/create` now accepts an optional `motherTreeMemberId` in the request body:
     ```json
     {
       "name": "Full Name",
       "email": "user@example.com",
       "password": "password123",
       "motherTreeMemberId": "66...motherMemberId"
     }
     ```
     If provided, the user is automatically attached to the selected mother tree branch upon registration.
2. **Users Directory Filtering Options**:
   - `GET /users`: Standard user directory endpoint.
   - For mobile app member directories to show only users placed in the family tree: pass `GET /users?placedOnly=true` or `GET /users?treeJoinStatus=placed`.
   - Super Admin dashboard can view all users normally to manage/delete them.
3. **Mother Tree Listing Endpoint**:
   - `GET /member/mother-trees` (and `GET /tree/mother-trees`):
     Returns the default tree root (Mohammad) and all level-1 mother branches (Lulouah, Ibrahim, Huda, Nasser, Haifa, etc.) complete with populated `profileImage`, `name`, `arabicName`, `email`, and `_id`.

### What the Mobile App Should Do:
- **Preferred Option**: During onboarding / registration, allow the user to select their mother tree, and send `motherTreeMemberId` directly in `POST /auth/create`.
- **Existing Multi-Step Flow**:
  - If using the existing flow, after OTP verification, fetch mother trees using `GET /member/mother-trees`.
  - Display the branches with their names and `profileImage` (with a local placeholder icon if `profileImage` is null).
  - Call `POST /member/choose-mother/:motherTreeMemberId`.
  - Prevent user from navigating to the main app feed until `choose-mother` is completed.

---

## 3. Announcement Request Page (Privacy & Role Isolation)

### What Changed on the Backend:
1. **Automatic Privacy Isolation in `GET /announcement`**:
   - When a normal user (`role: "user"`) requests announcements with `status=pending` or `status=declined` or `isRequest=true`, the backend **strictly enforces `createdBy: user.user`**.
   - Normal users can **never** see other users' pending announcement requests, even if `targetType: "all"`.
   - Normal users only see all approved announcements on the main public feed (`status=approved`).
   - Admins and Super Admins (`role: "admin"` or `role: "superAdmin"`) continue to see all submitted requests across all users.
2. **Dedicated My-Requests Route**:
   - `GET /announcement/my-requests`: Explicit endpoint that returns only the logged-in user's submitted announcements.
   - Also supported: `GET /announcement?type=my` or `GET /announcement?status=pending`.

### What the Mobile App Should Do:
- In the user's **"Announcement Request"** page (where a user tracks their own submitted announcements):
  - Call `GET /announcement/my-requests` OR `GET /announcement?status=pending`.
  - The backend now guarantees that only the logged-in user's own requests are returned.

### What the Admin Dashboard Should Do:
- In the Admin announcement review screen:
  - Call `GET /announcement?status=pending`.
  - Admins will see all pending announcement requests from all users to approve or decline.

---

## 4. Admin Access & Interface Alignment

### What Changed on the Backend:
1. **Admin Permissions**:
   - All SuperAdmin management routes (`/super-admin/stats`, `/super-admin/requests/update/:requestId`, `/super-admin/role/update/:userId`, `/super-admin/block-unblock/:userId`, `/super-admin/users/:userId`) accept both `role: "admin"` and `role: "superAdmin"`.
   - Role update endpoint `PATCH /super-admin/role/update/:userId` with payload `{ "role": "admin" }` properly assigns the admin role.
2. **Login Response**:
   - `POST /auth/login` returns the updated user role (`role: "admin"`).

### What the Dashboard & App Should Do:
- **Admin Web Dashboard**: Ensure the login guard / route guard checks for both `role === 'superAdmin' || role === 'admin'`. (Do not block users if their role is `"admin"` instead of `"superAdmin"`).
- **Mobile App**: If the app contains an admin portal button/tab, display it for users where `user.role === 'admin' || user.role === 'superAdmin'`.

---

## 5. Mother Tree Profile Picture Alignment

### What Changed on the Backend:
- All tree and member endpoints now explicitly populate:
  `populate("linkedUser", "_id name arabicName email role profileImage phone dateOfBirth gender education universityName fieldOfWork linkedinLink")`
- In `GET /member/mother-trees`, `GET /tree/full`, `GET /tree/me`, and `GET /tree/:memberId`, `profileImage` is populated.

### What the Mobile App Should Do:
- On the mother tree card/list item:
  - Check `member.linkedUser?.profileImage`.
  - If `profileImage` is present and valid, load it via cached network image.
  - If `profileImage` is `null` or fails to load, display a default avatar placeholder (e.g. standard user avatar image asset).

---

## Summary of Updated Endpoints Table

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `DELETE` | `/super-admin/users/:userId` | `admin`, `superAdmin` | Delete user account from Super Admin dashboard |
| `DELETE` | `/super-admin/delete-account/:userId` | `admin`, `superAdmin` | Alias for account deletion |
| `DELETE` | `/users/me` | `user`, `admin`, `superAdmin` | Delete own account (In-app user settings) |
| `DELETE` | `/users/:id` | `admin`, `superAdmin` | Delete user by ID |
| `GET` | `/member/mother-trees` | Public / All | Get root member and all mother branches with `profileImage` |
| `GET` | `/tree/mother-trees` | Public / All | Alias to get mother branches |
| `POST` | `/auth/create` | Public | Can now accept optional `motherTreeMemberId` |
| `GET` | `/users` | Public / All | Returns users directory (supports filter `?placedOnly=true` or `?treeJoinStatus=placed`) |
| `GET` | `/announcement` | All | Regular users see only their own pending requests; admins see all |
| `GET` | `/announcement/my-requests` | All | Get only current user's submitted announcement requests |
