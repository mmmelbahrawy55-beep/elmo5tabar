# Test Case Catalog

## Al Mokhtabar Laboratory Platform

| Metadata | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Last Updated** | 2026-07-30 |
| **Total Test Cases** | 130 |
| **Automated** | 120 (92%) |
| **Manual** | 10 (8%) |

---

## Module 1: Auth (20 Test Cases)

### TC-AUTH-001: Successful User Registration
| Field | Value |
|---|---|
| **ID** | TC-AUTH-001 |
| **Title** | Successful user registration with valid data |
| **Description** | Verify that a new user can register with valid credentials and required fields |
| **Preconditions** | User does not exist in the system, registration is enabled |
| **Steps** | 1. Navigate to `/ar/register` 2. Enter full name "محمد أحمد" 3. Enter email "mohammed@example.com" 4. Enter phone "+966501234567" 5. Select gender "ذكر" 6. Enter date of birth "1990-01-15" 7. Enter password "StrongP@ss1" 8. Confirm password "StrongP@ss1" 9. Accept terms and conditions 10. Click "إنشاء حساب" |
| **Expected Result** | Account created successfully, verification email sent, user redirected to `/ar/verify-email` |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-002: Registration with Existing Email
| Field | Value |
|---|---|
| **ID** | TC-AUTH-002 |
| **Title** | Registration with existing email returns 409 conflict |
| **Description** | Verify that registering with an already-used email address returns proper conflict error |
| **Preconditions** | User with email "mohammed@example.com" already exists |
| **Steps** | 1. Navigate to `/ar/register` 2. Enter full name "محمد أحمد" 3. Enter email "mohammed@example.com" 4. Fill remaining valid fields 5. Submit registration form |
| **Expected Result** | 409 Conflict returned, error message "البريد الإلكتروني مستخدم بالفعل" (Email already in use) displayed |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-003: Registration with Weak Password
| Field | Value |
|---|---|
| **ID** | TC-AUTH-003 |
| **Title** | Registration with weak password shows validation error |
| **Description** | Verify that passwords not meeting strength requirements are rejected with clear guidance |
| **Preconditions** | User is on registration page |
| **Steps** | 1. Enter password "12345" 2. Confirm password "12345" 3. Attempt to submit form |
| **Expected Result** | Validation error: password must be at least 8 characters, contain uppercase, lowercase, number, and special character |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-004: Successful Login with Valid Credentials
| Field | Value |
|---|---|
| **ID** | TC-AUTH-004 |
| **Title** | Successful login with valid email and password |
| **Description** | Verify that a verified user can log in with correct credentials |
| **Preconditions** | User is verified, account is active, not locked |
| **Steps** | 1. Navigate to `/ar/login` 2. Enter email "patient@example.com" 3. Enter password "Patient@123" 4. Click "تسجيل الدخول" |
| **Expected Result** | User logged in, redirected to dashboard, JWT tokens (access + refresh) stored in httpOnly cookies, user profile data returned |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-005: Login with Incorrect Password
| Field | Value |
|---|---|
| **ID** | TC-AUTH-005 |
| **Title** | Login with incorrect password returns 401 |
| **Description** | Verify that wrong password returns unauthorized error without revealing which field is incorrect |
| **Preconditions** | User exists and is verified |
| **Steps** | 1. Navigate to login page 2. Enter email "patient@example.com" 3. Enter password "WrongPass123!" 4. Submit |
| **Expected Result** | 401 Unauthorized, generic error message "البريد الإلكتروني أو كلمة المرور غير صحيحة" (Email or password incorrect) |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-006: Login with Locked Account
| Field | Value |
|---|---|
| **ID** | TC-AUTH-006 |
| **Title** | Login with locked account displays lockout message |
| **Description** | Verify that a locked account (after 5 failed attempts) shows appropriate message |
| **Preconditions** | Account is locked due to 5 consecutive failed login attempts |
| **Steps** | 1. Navigate to login page 2. Enter credentials for locked account 3. Submit |
| **Expected Result** | 423 Locked, message "تم قفل الحساب due to multiple failed attempts. يرجى المحاولة بعد 15 دقيقة" (Account locked. Try again in 15 minutes) |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-007: Login with Unverified Email
| Field | Value |
|---|---|
| **ID** | TC-AUTH-007 |
| **Title** | Login with unverified email shows verification prompt |
| **Description** | Verify that unverified accounts cannot log in and are prompted to verify |
| **Preconditions** | Account exists but email is not verified |
| **Steps** | 1. Navigate to login page 2. Enter unverified account credentials 3. Submit |
| **Expected Result** | 403 Forbidden, message "يرجى تأكيد بريدك الإلكتروني أولاً" (Please verify your email first), resend verification option displayed |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-008: MFA Login with Valid TOTP
| Field | Value |
|---|---|
| **ID** | TC-AUTH-008 |
| **Title** | MFA login completes successfully with valid TOTP code |
| **Description** | Verify that MFA-enabled users can complete login with valid TOTP |
| **Preconditions** | User has MFA enabled, first factor (password) passed |
| **Steps** | 1. Complete first factor login 2. Redirected to `/ar/mfa` 3. Generate TOTP from authenticator app 4. Enter 6-digit code 5. Submit |
| **Expected Result** | MFA verified, full access granted, session created, "trust this device" option available |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-009: MFA Login with Invalid TOTP
| Field | Value |
|---|---|
| **ID** | TC-AUTH-009 |
| **Title** | MFA login fails with invalid/expired TOTP code |
| **Description** | Verify that invalid TOTP codes are rejected with clear error |
| **Preconditions** | User has MFA enabled, at MFA verification screen |
| **Steps** | 1. Enter expired/random 6-digit TOTP code "000000" 2. Submit |
| **Expected Result** | Error "رمز التحقق غير صالح" (Invalid verification code), code field cleared, 3 remaining attempts counter shown |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-010: Token Refresh with Valid Refresh Token
| Field | Value |
|---|---|
| **ID** | TC-AUTH-010 |
| **Title** | Token refresh succeeds with valid refresh token |
| **Description** | Verify that API returns new access token when valid refresh token is provided |
| **Preconditions** | User is logged in, refresh token is valid and not expired |
| **Steps** | 1. Call `POST /api/v1/auth/refresh` with valid refresh token |
| **Expected Result** | 200 OK, new access token + new refresh token returned, old refresh token invalidated |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-011: Token Refresh with Expired Refresh Token
| Field | Value |
|---|---|
| **ID** | TC-AUTH-011 |
| **Title** | Token refresh fails with expired refresh token |
| **Description** | Verify that expired refresh tokens return 401 and require re-login |
| **Preconditions** | Refresh token has exceeded its TTL (7 days) |
| **Steps** | 1. Call `POST /api/v1/auth/refresh` with expired refresh token |
| **Expected Result** | 401 Unauthorized, error "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى" (Session expired. Please login again) |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-012: Token Refresh with Reused Token
| Field | Value |
|---|---|
| **ID** | TC-AUTH-012 |
| **Title** | Reused refresh token triggers token family detection |
| **Description** | Verify that reusing an already-refreshed token invalidates the entire token family (potential token theft) |
| **Preconditions** | User has a refresh token that has already been used for a refresh cycle |
| **Steps** | 1. Capture a refresh token before refresh 2. Perform legitimate refresh (gets new tokens) 3. Attempt to refresh using the original (now stale) refresh token |
| **Expected Result** | 401 Unauthorized, entire token family invalidated, all sessions for user are revoked, forced re-login on all devices |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-013: Forgot Password with Existing Email
| Field | Value |
|---|---|
| **ID** | TC-AUTH-013 |
| **Title** | Forgot password sends reset email for existing account |
| **Description** | Verify that password reset flow initiates for registered email |
| **Preconditions** | User exists and is verified |
| **Steps** | 1. Navigate to `/ar/forgot-password` 2. Enter email "patient@example.com" 3. Click "إرسال رابط إعادة التعيين" |
| **Expected Result** | 200 OK, success message "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" (Reset link sent to your email), email received within 30s |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-014: Forgot Password with Non-Existent Email
| Field | Value |
|---|---|
| **ID** | TC-AUTH-014 |
| **Title** | Forgot password returns 200 for non-existent email (no info leak) |
| **Description** | Verify that the system does not reveal whether an email exists (security best practice) |
| **Preconditions** | Email does not exist in the system |
| **Steps** | 1. Navigate to `/ar/forgot-password` 2. Enter email "nonexistent@example.com" 3. Click "إرسال رابط إعادة التعيين" |
| **Expected Result** | 200 OK, same success message as TC-AUTH-013 (no indication that email doesn't exist), no email is actually sent |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-015: Password Reset with Valid Token
| Field | Value |
|---|---|
| **ID** | TC-AUTH-015 |
| **Title** | Password reset succeeds with valid reset token |
| **Description** | Verify that user can reset password using valid reset link |
| **Preconditions** | Valid password reset token obtained via email |
| **Steps** | 1. Navigate to reset URL from email 2. Enter new password "NewStrong@123" 3. Confirm password 4. Submit 5. Log in with new password |
| **Expected Result** | Password changed successfully, can log in with new password, old password no longer works |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-016: Password Reset with Expired Token
| Field | Value |
|---|---|
| **ID** | TC-AUTH-016 |
| **Title** | Password reset fails with expired token |
| **Description** | Verify that expired reset tokens (1 hour TTL) are rejected |
| **Preconditions** | Password reset token has exceeded 1-hour TTL |
| **Steps** | 1. Navigate to expired reset URL 2. Enter new password 3. Submit |
| **Expected Result** | Error "رابط إعادة التعيين منتهي الصلاحية. يرجى طلب رابط جديد" (Reset link expired. Please request a new one) |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-017: OAuth Login with Google
| Field | Value |
|---|---|
| **ID** | TC-AUTH-017 |
| **Title** | OAuth login with Google creates/links account |
| **Description** | Verify that Google OAuth flow works end-to-end |
| **Preconditions** | Google OAuth is configured, user has Google account |
| **Steps** | 1. Navigate to `/ar/login` 2. Click "تسجيل الدخول عبر Google" 3. Select Google account 4. Grant permissions 5. Redirect back to platform |
| **Expected Result** | Account created/linked, logged in successfully, redirected to dashboard |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-018: OAuth Login with Apple
| Field | Value |
|---|---|
| **ID** | TC-AUTH-018 |
| **Title** | OAuth login with Apple creates/links account |
| **Description** | Verify that Apple OAuth flow works end-to-end |
| **Preconditions** | Apple OAuth is configured, user has Apple ID |
| **Steps** | 1. Navigate to `/ar/login` 2. Click "تسجيل الدخول عبر Apple" 3. Authenticate with Apple ID 4. Return to platform |
| **Expected Result** | Account created/linked, logged in successfully |
| **Priority** | P2 |
| **Automation Status** | ⬜ Manual (requires Apple device) |

### TC-AUTH-019: Device Management
| Field | Value |
|---|---|
| **ID** | TC-AUTH-019 |
| **Title** | Device management: list, remove, identify current device |
| **Description** | Verify that users can view and manage their active sessions |
| **Preconditions** | User is logged in on at least 2 devices |
| **Steps** | 1. Navigate to `/ar/profile/devices` 2. View list of active devices 3. Identify current device 4. Remove a remote device 5. Verify remote device is logged out |
| **Expected Result** | Device list shown with device name, browser, OS, last active time. Current device marked. Removed device's session terminated immediately |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-AUTH-020: Session Timeout After Inactivity
| Field | Value |
|---|---|
| **ID** | TC-AUTH-020 |
| **Title** | Auto-logout after prolonged inactivity |
| **Description** | Verify that idle sessions are automatically terminated after 30 minutes of inactivity |
| **Preconditions** | User is logged in |
| **Steps** | 1. Log in and navigate to dashboard 2. Remain inactive for 30 minutes 3. Attempt to navigate to a new page 4. Click a link |
| **Expected Result** | Session expired modal appears, user is redirected to login page after confirmation, warning shown at 25 min mark |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

---

## Module 2: Appointments (15 Test Cases)

### TC-APT-001: Create Appointment - Success
| Field | Value |
|---|---|
| **ID** | TC-APT-001 |
| **Title** | Create appointment with valid data |
| **Description** | Verify user can book an appointment successfully |
| **Preconditions** | User is logged in, has active patient profile |
| **Steps** | 1. Navigate to `/ar/appointments/book` 2. Select branch "الرياض - فرع 1" 3. Select test package "فحص شامل" 4. Choose available date 5. Choose available time slot 6. Add optional notes 7. Click "تأكيد الحجز" |
| **Expected Result** | Appointment created, confirmation shown with ID, branch address, date/time, and QR code. SMS and email confirmation sent within 30s |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-APT-002: Create Appointment - No Available Slots
| Field | Value |
|---|---|
| **ID** | TC-APT-002 |
| **Title** | No available slots shows appropriate message |
| **Description** | Verify that fully booked dates show no-slot message |
| **Preconditions** | Selected date has all slots booked |
| **Steps** | 1. Navigate to book appointment 2. Select branch and test 3. Select a fully booked date |
| **Expected Result** | Message "لا توجد مواعيد متاحة في هذا اليوم" (No appointments available on this date) with option to view next available date |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-003: Create Appointment - Past Date
| Field | Value |
|---|---|
| **ID** | TC-APT-003 |
| **Title** | Past dates cannot be selected |
| **Description** | Verify that past dates are disabled in the date picker |
| **Preconditions** | User is on appointment booking page |
| **Steps** | 1. Open date picker 2. Attempt to select yesterday's date |
| **Expected Result** | Past dates are grayed out and non-selectable |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-004: Reschedule Appointment - Success
| Field | Value |
|---|---|
| **ID** | TC-APT-004 |
| **Title** | Reschedule appointment to a new slot |
| **Description** | Verify user can reschedule an existing appointment |
| **Preconditions** | User has an active (upcoming) appointment |
| **Steps** | 1. Navigate to `/ar/appointments` 2. Select upcoming appointment 3. Click "إعادة جدولة" 4. Select new date 5. Select new time slot 6. Confirm |
| **Expected Result** | Appointment rescheduled, old slot released back to pool, new confirmation sent via SMS/email |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-APT-005: Reschedule Appointment - Less Than 2 Hours
| Field | Value |
|---|---|
| **ID** | TC-APT-005 |
| **Title** | Cannot reschedule within 2 hours of appointment |
| **Description** | Verify that appointments within 2 hours cannot be rescheduled online |
| **Preconditions** | Appointment is within 2 hours of current time |
| **Steps** | 1. Navigate to appointment details 2. Click "إعادة جدولة" |
| **Expected Result** | Reschedule option disabled, message "لا يمكن إعادة الجدولة قبل الموعد بأقل من ساعتين. يرجى الاتصال بالفرع" (Cannot reschedule less than 2 hours before. Please contact the branch) |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-006: Cancel Appointment - Success
| Field | Value |
|---|---|
| **ID** | TC-APT-006 |
| **Title** | Cancel an upcoming appointment |
| **Description** | Verify user can cancel an upcoming appointment |
| **Preconditions** | User has an upcoming appointment |
| **Steps** | 1. Navigate to appointment details 2. Click "إلغاء الموعد" 3. Select reason from list 4. Confirm cancellation |
| **Expected Result** | Appointment cancelled, slot released, cancellation confirmation sent, refund processed if applicable |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-APT-007: Cancel Appointment - Completed Appointment
| Field | Value |
|---|---|
| **ID** | TC-APT-007 |
| **Title** | Cannot cancel a completed appointment |
| **Description** | Verify that past/completed appointments show no cancel option |
| **Preconditions** | Appointment status is "completed" or "checked-in" |
| **Steps** | 1. Navigate to completed appointment details |
| **Expected Result** | Cancel button not displayed, only "إعادة طلب" (Re-order) option available |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-APT-008: Appointment Queue - Real-time Updates
| Field | Value |
|---|---|
| **ID** | TC-APT-008 |
| **Title** | Appointment queue position updates in real-time |
| **Description** | Verify WebSocket delivers live queue position updates |
| **Preconditions** | User has checked in for an appointment |
| **Steps** | 1. Check in at branch via QR code 2. Observe queue position on screen 3. Wait for another patient to be served |
| **Expected Result** | Queue position number decrements in real-time via WebSocket, estimated wait time updates, "your turn" notification triggers |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-APT-009: Appointment History
| Field | Value |
|---|---|
| **ID** | TC-APT-009 |
| **Title** | View complete appointment history |
| **Description** | Verify users can view their full appointment history with filters |
| **Preconditions** | User has multiple appointments across different statuses |
| **Steps** | 1. Navigate to `/ar/appointments/history` 2. View list 3. Filter by status (completed, cancelled, upcoming) 4. Filter by date range 5. Click on individual appointment for details |
| **Expected Result** | All appointments listed with pagination, filters work correctly, detail view shows full history (date, branch, tests, results, payments) |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-010: Branch Selection - Map View
| Field | Value |
|---|---|
| **ID** | TC-APT-010 |
| **Title** | Branch selection with map and distance |
| **Description** | Verify branch selection shows map with markers and distance calculation |
| **Preconditions** | User location is enabled |
| **Steps** | 1. Navigate to book appointment 2. Click "اختيار الفرع" 3. View branches on map 4. Check distance display 5. Use search/filter |
| **Expected Result** | Map loads with markers for all branches, nearest branch highlighted, distance displayed in km, search filters by city/area |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-011: Multiple Test Selection
| Field | Value |
|---|---|
| **ID** | TC-APT-011 |
| **Title** | Select multiple tests in one appointment |
| **Description** | Verify user can select multiple tests/packages in a single booking |
| **Preconditions** | User is on booking page |
| **Steps** | 1. Browse test catalog 2. Select multiple individual tests 3. Select a package 4. Verify combined price 5. Proceed to booking |
| **Expected Result** | Tests added to cart, total price calculated (with package discounts), combined duration estimate shown, proceed to booking |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-012: Family Member Booking
| Field | Value |
|---|---|
| **ID** | TC-APT-012 |
| **Title** | Book appointment for family member |
| **Description** | Verify user can book on behalf of a registered family member |
| **Preconditions** | User has family members added to their profile |
| **Steps** | 1. Navigate to book appointment 2. Select "حجز لشخص آخر" 3. Choose family member from list 4. Select tests and time 5. Confirm |
| **Expected Result** | Appointment created for family member, confirmation sent to both main account holder and family member's contact |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-013: Insurance Verification During Booking
| Field | Value |
|---|---|
| **ID** | TC-APT-013 |
| **Title** | Insurance verification during appointment booking |
| **Description** | Verify insurance eligibility is checked during booking flow |
| **Preconditions** | User has insurance plan on file |
| **Steps** | 1. Begin booking flow 2. Insurance info auto-populated 3. Select tests 4. Verify coverage amount shown |
| **Expected Result** | Insurance eligibility verified in real-time, coverage amount displayed, co-pay amount calculated and shown before confirmation |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-APT-014: Appointment Reminder Notifications
| Field | Value |
|---|---|
| **ID** | TC-APT-014 |
| **Title** | Appointment reminder notifications fire correctly |
| **Description** | Verify reminder cascade: 24h, 2h, and 30min before appointment |
| **Preconditions** | User has upcoming appointment |
| **Steps** | 1. Book appointment for future date 2. Wait for 24h mark 3. Wait for 2h mark 4. Wait for 30min mark |
| **Expected Result** | 24h before: SMS + WhatsApp reminder. 2h before: Push notification + email. 30min before: SMS with QR code and branch map link |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-APT-015: Appointment Check-in via QR
| Field | Value |
|---|---|
| **ID** | TC-APT-015 |
| **Title** | Check in at branch using QR code |
| **Description** | Verify check-in flow via appointment QR code |
| **Preconditions** | User has upcoming appointment for today, arrived at branch |
| **Steps** | 1. Open appointment QR code 2. Branch scans QR at kiosk/tablet 3. Status updates to "checked-in" 4. Queue position assigned |
| **Expected Result** | Appointment status changes to "checked-in", queue position assigned, notification sent to user, SMS with queue number sent |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

---

## Module 3: Results (15 Test Cases)

### TC-RES-001: View Test Results
| Field | Value |
|---|---|
| **ID** | TC-RES-001 |
| **Title** | View completed test results |
| **Description** | Verify that users can view their completed test results with all details |
| **Preconditions** | User has at least one completed test result |
| **Steps** | 1. Navigate to `/ar/results` 2. Select a completed test result 3. View result details |
| **Expected Result** | Results page loads within 2s, displays: test name, date, result value, reference range, unit, status (normal/abnormal), doctor comments |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-RES-002: Display Abnormal Results
| Field | Value |
|---|---|
| **ID** | TC-RES-002 |
| **Title** | Abnormal results are highlighted |
| **Description** | Verify results outside reference range are visually flagged |
| **Preconditions** | Result has values outside normal reference range |
| **Steps** | 1. Navigate to completed test result 2. Observe abnormal values |
| **Expected Result** | Out-of-range values highlighted in red (high) or blue (low), arrow indicator showing direction, reference range displayed alongside |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RES-003: Download PDF Report
| Field | Value |
|---|---|
| **ID** | TC-RES-003 |
| **Title** | Download result as PDF |
| **Description** | Verify PDF download of test results |
| **Preconditions** | Completed test result is available |
| **Steps** | 1. Navigate to result details 2. Click "تحميل PDF" 3. Observe PDF generation and download |
| **Expected Result** | PDF generated within 5s, contains: lab logo, patient info, test results table, reference ranges, doctor signature, QR code for verification, date |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-RES-004: Share Results via Link
| Field | Value |
|---|---|
| **ID** | TC-RES-004 |
| **Title** | Share results via secure link |
| **Description** | Verify secure sharing of results with third parties |
| **Preconditions** | Completed test result is available |
| **Steps** | 1. Click "مشاركة" on result 2. Set expiration (24h/48h/7d) 3. Optionally set PIN 4. Generate link 5. Copy and open in incognito |
| **Expected Result** | Secure link generated, recipient can view result with/without PIN, link expires after set duration, access logged in audit trail |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RES-005: Compare Results Over Time
| Field | Value |
|---|---|
| **ID** | TC-RES-005 |
| **Title** | Compare test results across dates |
| **Description** | Verify the comparison view for repeated tests |
| **Preconditions** | User has taken the same test multiple times on different dates |
| **Steps** | 1. Navigate to a repeated test 2. Click "مقارنة" 3. Select date range 4. View comparison chart |
| **Expected Result** | Side-by-side comparison table and trend chart (line graph), delta values shown, percentage change, flags for significant changes |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RES-006: Critical Alert Notification
| Field | Value |
|---|---|
| **ID** | TC-RES-006 |
| **Title** | Critical result triggers immediate notification |
| **Description** | Verify that critically abnormal results trigger urgent notification cascade |
| **Preconditions** | Result value exceeds critical threshold |
| **Steps** | 1. Lab technician enters critically abnormal result 2. Observe system behavior |
| **Expected Result** | Critical alert triggered: popup in lab dashboard, SMS to patient, WhatsApp to patient, email to patient, push notification, alert logged in audit |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-RES-007: Results Filtering and Search
| Field | Value |
|---|---|
| **ID** | TC-RES-007 |
| **Title** | Filter and search test results |
| **Description** | Verify users can filter and search their results |
| **Preconditions** | User has 10+ results across different dates/types |
| **Steps** | 1. Navigate to `/ar/results` 2. Filter by date range 3. Filter by test type/category 4. Filter by status (normal/abnormal/pending) 5. Search by test name |
| **Expected Result** | Filters apply correctly, search finds matching results, combined filters work, pagination shows correct total count |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RES-008: Pending Results Display
| Field | Value |
|---|---|
| **ID** | TC-RES-008 |
| **Title** | Pending/in-progress results show appropriate status |
| **Description** | Verify pending results display progress information |
| **Preconditions** | Test has been processed but results not yet finalized |
| **Steps** | 1. Navigate to results list 2. Observe pending result card |
| **Expected Result** | "قيد الإجراء" (In Progress) status badge, estimated completion time, progress steps (Received → Processing → Reviewing → Completed) |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-RES-009: Graph/Chart Display for Quantitative Tests
| Field | Value |
|---|---|
| **ID** | TC-RES-009 |
| **Title** | Quantitative test results show graphical representation |
| **Description** | Verify that numerical results display in visual chart format |
| **Preconditions** | Result is quantitative (e.g., blood count, glucose level) |
| **Steps** | 1. Open quantitative test result 2. Observe graphical display |
| **Expected Result** | Bar chart/gauge showing value relative to reference range, color-coded (green=normal, yellow=borderline, red=abnormal), exact value annotated |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RES-010: Result Verification via QR Code
| Field | Value |
|---|---|
| **ID** | TC-RES-010 |
| **Title** | Verify result authenticity via QR code |
| **Description** | Verify that QR code on PDF can authenticate the result |
| **Preconditions** | Completed test result PDF with QR code |
| **Steps** | 1. Open PDF 2. Scan QR code with phone 3. Navigate to verification page |
| **Expected Result** | Verification page confirms result authenticity: result ID, date, patient name (partial), laboratory name, "النتيجة موثقة" (Result Verified) badge |
| **Priority** | P2 |
| **Automation Status** | ⬜ Manual |

### TC-RES-011: Historical Results Access
| Field | Value |
|---|---|
| **ID** | TC-RES-011 |
| **Title** | Access results older than 1 year |
| **Description** | Verify archival results are accessible |
| **Preconditions** | User has results dating back 2+ years |
| **Steps** | 1. Navigate to `/ar/results` 2. Set filter to show all dates 3. Select a result from 2 years ago |
| **Expected Result** | Archived result loads correctly from cold storage (may take 2-3s additional), all data intact, PDF available |
| **Priority** | P3 |
| **Automation Status** | ⬜ Manual |

### TC-RES-012: Role-Based Access to Results
| Field | Value |
|---|---|
| **ID** | TC-RES-012 |
| **Title** | Role-based access control for results viewing |
| **Description** | Verify results are only accessible by authorized users |
| **Preconditions** | Patient A has results, Patient B is another user, Doctor has access to Patient A |
| **Steps** | 1. Log in as Patient B 2. Attempt to access Patient A's result URL directly 3. Log in as Doctor 4. Access Patient A's result |
| **Expected Result** | Patient B: 403 Forbidden. Doctor: allowed (with audit log entry). Admin: allowed (with audit). Unauthenticated: 401 |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-RES-013: Results Export (CSV/Excel)
| Field | Value |
|---|---|
| **ID** | TC-RES-013 |
| **Title** | Export results in bulk |
| **Description** | Verify bulk export of results |
| **Preconditions** | User has multiple results |
| **Steps** | 1. Navigate to results 2. Select multiple results 3. Click "تصدير" 4. Choose CSV format 5. Choose Excel format |
| **Expected Result** | CSV export: comma-separated with headers, UTF-8 BOM for Arabic. Excel export: formatted with proper RTL support, column widths, headers |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-RES-014: Doctor Comments and Recommendations
| Field | Value |
|---|---|
| **ID** | TC-RES-014 |
| **Title** | Doctor comments display on results |
| **Description** | Verify doctor's notes and recommendations appear on results |
| **Preconditions** | Result includes doctor review with comments |
| **Steps** | 1. Open completed result 2. Scroll to doctor's section |
| **Expected Result** | Doctor name and license number displayed, comments section with recommendations, follow-up date suggestion, referral to specialist if applicable |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RES-015: Result Not Available Message
| Field | Value |
|---|---|
| **ID** | TC-RES-015 |
| **Title** | Empty state for users with no results |
| **Description** | Verify appropriate empty state display |
| **Preconditions** | New user with zero test results |
| **Steps** | 1. Log in as new user 2. Navigate to `/ar/results` |
| **Expected Result** | Empty state illustration with message "لا توجد نتائج بعد" (No results yet), CTA button "احجز موعداً" (Book an Appointment), animated illustration |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

---

## Module 4: Payments (20 Test Cases)

### TC-PAY-001: Stripe Payment - Success
| Field | Value |
|---|---|
| **ID** | TC-PAY-001 |
| **Title** | Successful Stripe credit card payment |
| **Description** | Verify end-to-end Stripe payment with valid card |
| **Preconditions** | User has pending invoice, Stripe gateway active |
| **Steps** | 1. Navigate to payment page 2. Select Stripe 3. Enter card 4242 4242 4242 4242 4. Enter expiry 12/28 5. Enter CVC 123 6. Submit payment |
| **Expected Result** | Payment successful, invoice status → paid, receipt sent via email, transaction ID stored, wallet balance updated |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-PAY-002: Stripe Payment - Declined Card
| Field | Value |
|---|---|
| **ID** | TC-PAY-002 |
| **Title** | Stripe payment with declined card |
| **Description** | Verify proper error handling for declined transactions |
| **Preconditions** | User has pending invoice |
| **Steps** | 1. Select Stripe payment 2. Enter card 4000 0000 0000 0002 3. Complete payment form |
| **Expected Result** | Payment declined, clear error message "تم رفض البطاقة" (Card declined), suggest alternative payment methods, no charge made |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-003: Tap Payment - Success
| Field | Value |
|---|---|
| **ID** | TC-PAY-003 |
| **Title** | Successful Tap payment (KNET/benefit) |
| **Description** | Verify Tap payment gateway integration |
| **Preconditions** | User has pending invoice, Tap gateway active |
| **Steps** | 1. Select Tap payment 2. Choose KNET 3. Redirect to bank page 4. Complete payment 5. Return to platform |
| **Expected Result** | Payment successful via Tap, invoice paid, redirect back with success confirmation, webhook received |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-004: HyperPay Payment - Success
| Field | Value |
|---|---|
| **ID** | TC-PAY-004 |
| **Title** | Successful HyperPay payment (MADA) |
| **Description** | Verify HyperPay payment gateway integration |
| **Preconditions** | User has pending invoice, HyperPay gateway active |
| **Steps** | 1. Select HyperPay/MADA 2. Enter card details 3. Complete 3DS verification 4. Return to platform |
| **Expected Result** | Payment successful via HyperPay, invoice paid |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-005: PayPal Payment - Success
| Field | Value |
|---|---|
| **ID** | TC-PAY-005 |
| **Title** | Successful PayPal payment |
| **Description** | Verify PayPal payment gateway integration |
| **Preconditions** | User has pending invoice, PayPal gateway active |
| **Steps** | 1. Select PayPal 2. Redirect to PayPal 3. Log in and approve 4. Return to platform |
| **Expected Result** | Payment successful via PayPal, invoice paid |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-006: Wallet Payment - Success
| Field | Value |
|---|---|
| **ID** | TC-PAY-006 |
| **Title** | Successful wallet payment |
| **Description** | Verify payment using platform wallet balance |
| **Preconditions** | User has sufficient wallet balance |
| **Steps** | 1. Select wallet payment 2. Confirm amount 3. Enter wallet PIN 4. Submit |
| **Expected Result** | Payment successful, wallet balance debited, transaction in wallet history |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-007: Wallet Payment - Insufficient Balance
| Field | Value |
|---|---|
| **ID** | TC-PAY-007 |
| **Title** | Wallet payment fails with insufficient balance |
| **Description** | Verify proper handling of insufficient wallet balance |
| **Preconditions** | Wallet balance < invoice amount |
| **Steps** | 1. Select wallet payment 2. Observe balance display 3. Attempt payment |
| **Expected Result** | Error "الرصيد غير كافٍ" (Insufficient balance), option to pay partial with wallet + card, or top up wallet |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-008: Partial Payment (Wallet + Card)
| Field | Value |
|---|---|
| **ID** | TC-PAY-008 |
| **Title** | Split payment between wallet and card |
| **Description** | Verify split payment functionality |
| **Preconditions** | Wallet balance covers part of invoice |
| **Steps** | 1. Select split payment 2. Enter wallet amount 3. Pay remaining via Stripe 4. Complete both payments |
| **Expected Result** | Both payments processed, invoice paid, receipt shows split payment breakdown |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-009: Invoice Generation
| Field | Value |
|---|---|
| **ID** | TC-PAY-009 |
| **Title** | Invoice generated on appointment booking |
| **Description** | Verify invoice is auto-generated when booking with paid tests |
| **Preconditions** | User books appointment with paid tests |
| **Steps** | 1. Complete booking with cost 2. Navigate to `/ar/invoices` 3. View generated invoice |
| **Expected Result** | Invoice created with unique number, amount matches booking total, ZATCA-compliant QR code, status "pending" before payment |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-010: Invoice with Insurance
| Field | Value |
|---|---|
| **ID** | TC-PAY-010 |
| **Title** | Invoice shows insurance coverage breakdown |
| **Description** | Verify invoice includes insurance discount/coverage |
| **Preconditions** | User has active insurance with coverage for selected tests |
| **Steps** | 1. Book appointment with insurance 2. View invoice |
| **Expected Result** | Invoice shows: total before insurance, insurance coverage amount, co-pay amount, remaining patient responsibility |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-011: Refund - Full Cancellation
| Field | Value |
|---|---|
| **ID** | TC-PAY-011 |
| **Title** | Full refund on appointment cancellation |
| **Description** | Verify refund is processed on timely cancellation |
| **Preconditions** | Paid invoice exists, cancellation is within refund window (> 2h before) |
| **Steps** | 1. Cancel appointment 2. Observe refund processing 3. Verify wallet/account |
| **Expected Result** | Refund initiated to original payment method, refund amount = full amount, processed within 5-7 business days, refund receipt emailed, invoice status → refunded |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-012: Refund - Partial
| Field | Value |
|---|---|
| **ID** | TC-PAY-012 |
| **Title** | Partial refund on late cancellation |
| **Description** | Verify partial refund for cancellations within 2-24h window |
| **Preconditions** | Appointment cancelled 3 hours before scheduled time |
| **Steps** | 1. Cancel appointment 2. Observe refund amount |
| **Expected Result** | 50% refund processed (per policy), remaining amount forfeited, clear breakdown shown |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-013: Subscription Payment - Create
| Field | Value |
|---|---|
| **ID** | TC-PAY-013 |
| **Title** | Create subscription plan |
| **Description** | Verify subscription creation and recurring payment setup |
| **Preconditions** | User is eligible for subscription plan |
| **Steps** | 1. Navigate to subscription plans 2. Select plan 3. Enter payment details 4. Confirm subscription |
| **Expected Result** | Subscription created, first payment processed, recurring schedule set, confirmation email sent, dashboard shows subscription status |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-014: Subscription Payment - Renewal
| Field | Value |
|---|---|
| **ID** | TC-PAY-014 |
| **Title** | Automatic subscription renewal |
| **Description** | Verify auto-renewal at end of billing period |
| **Preconditions** | Active subscription nearing renewal date |
| **Steps** | 1. Wait for renewal date 2. Observe system behavior |
| **Expected Result** | Recurring charge processed, subscription period extended, receipt emailed, dashboard updated. If payment fails: retry 3 times over 5 days, then downgrade |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-015: Subscription Cancellation
| Field | Value |
|---|---|
| **ID** | TC-PAY-015 |
| **Title** | Cancel subscription |
| **Description** | Verify subscription cancellation at end of billing period |
| **Preconditions** | Active subscription |
| **Steps** | 1. Navigate to subscription settings 2. Click "إلغاء الاشتراك" 3. Select reason 4. Confirm cancellation |
| **Expected Result** | Subscription set to cancel at period end, no further charges, access maintained until end date, confirmation email sent |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-016: Payment History
| Field | Value |
|---|---|
| **ID** | TC-PAY-016 |
| **Title** | View complete payment history |
| **Description** | Verify payment history display with filters |
| **Preconditions** | User has multiple past payments |
| **Steps** | 1. Navigate to `/ar/payments/history` 2. View all transactions 3. Filter by date, status, method 4. Export |
| **Expected Result** | Transaction list with: date, invoice #, amount, method, status. Filters work correctly. Export available. Pagination correct |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-017: Receipt Download
| Field | Value |
|---|---|
| **ID** | TC-PAY-017 |
| **Title** | Download tax-compliant receipt |
| **Description** | Verify ZATCA-compliant receipt download |
| **Preconditions** | Completed payment |
| **Steps** | 1. Navigate to payment details 2. Click "تحميل الإيصال" 3. Open PDF |
| **Expected Result** | PDF receipt includes: vendor info, buyer info, invoice #, date/time, line items, VAT breakdown, total, ZATCA QR code, cryptographic stamp |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-018: Failed Payment Retry
| Field | Value |
|---|---|
| **ID** | TC-PAY-018 |
| **Title** | Retry failed payment |
| **Description** | Verify user can retry a failed payment |
| **Preconditions** | Payment attempt failed (card declined) |
| **Steps** | 1. Receive payment failed notification 2. Navigate to invoice 3. Click "إعادة المحاولة" 4. Select different card 5. Complete payment |
| **Expected Result** | Retry successful, invoice paid, original failed attempt logged |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-PAY-019: Idempotency - Double Charge Prevention
| Field | Value |
|---|---|
| **ID** | TC-PAY-019 |
| **Title** | Idempotency key prevents double charge |
| **Description** | Verify idempotency keys prevent duplicate charges |
| **Preconditions** | First payment request submitted |
| **Steps** | 1. Submit payment with idempotency key X 2. Network timeout occurs (simulate) 3. Retry with same idempotency key X |
| **Expected Result** | Second request returns same result as first, no additional charge, single transaction recorded |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-PAY-020: Payment Gateway Fallback
| Field | Value |
|---|---|
| **ID** | TC-PAY-020 |
| **Title** | Automatic payment gateway fallback on failure |
| **Description** | Verify fallback to secondary gateway if primary fails |
| **Preconditions** | Primary gateway (Stripe) is experiencing downtime |
| **Steps** | 1. Initiate payment via Stripe 2. Stripe returns 503 3. Observe system behavior |
| **Expected Result** | Automatic fallback to secondary gateway (Tap/HyperPay), user sees "تحويل إلى بوابة الدفع البديلة..." (Redirecting to alternative gateway...), payment completes via fallback, logged in audit |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

---

## Module 5: Notifications (10 Test Cases)

### TC-NOT-001: WhatsApp Notification - Appointment Confirmation
| Field | Value |
|---|---|
| **ID** | TC-NOT-001 |
| **Title** | Appointment confirmation via WhatsApp |
| **Description** | Verify WhatsApp Business API sends appointment confirmation |
| **Preconditions** | User has opted into WhatsApp notifications |
| **Steps** | 1. Book appointment 2. Observe WhatsApp message delivery |
| **Expected Result** | WhatsApp message received within 30s with template: appointment date, time, branch, QR code, "إضافة إلى التقويم" link. Health rating request after appointment |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-NOT-002: Email Notification - Result Available
| Field | Value |
|---|---|
| **ID** | TC-NOT-002 |
| **Title** | Test result available via email |
| **Description** | Verify email notification when results are published |
| **Preconditions** | Test result has been finalized |
| **Steps** | 1. Lab publishes result 2. Observe email delivery |
| **Expected Result** | Email received within 30s: subject "نتائج الفحوصات متاحة", patient name, test names, secure view link, disclaimer, unsubscribe option. No PHI in subject line |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-NOT-003: SMS Notification - Critical Alert
| Field | Value |
|---|---|
| **ID** | TC-NOT-003 |
| **Title** | SMS sent for critical results |
| **Description** | Verify SMS delivery for critically abnormal results |
| **Preconditions** | Result flagged as critical |
| **Steps** | 1. Critical result entered 2. Observe SMS delivery |
| **Expected Result** | SMS sent immediately: "نتيجة حرجة - يرجى التوجه إلى الطوارئ فوراً. رمز التذكرة: XXXX" (Critical result - please go to ER immediately) |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-NOT-004: Push Notification - Reminder
| Field | Value |
|---|---|
| **ID** | TC-NOT-004 |
| **Title** | Push notification for appointment reminder |
| **Description** | Verify push notification delivery via Firebase/APNs |
| **Preconditions** | User has enabled push notifications, has upcoming appointment |
| **Steps** | 1. Schedule appointment 2h from now 2. Observe push notification |
| **Expected Result** | Push notification received: title "تذكير بالموعد", body "موعدك بعد ساعتين في فرع الرياض", click opens app to appointment details |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-NOT-005: Notification Template Rendering
| Field | Value |
|---|---|
| **ID** | TC-NOT-005 |
| **Title** | Notification template renders with correct variables |
| **Description** | Verify all template variables are interpolated correctly |
| **Preconditions** | Template with variables defined |
| **Steps** | 1. Trigger notification with known data 2. Inspect delivered message |
| **Expected Result** | All variables replaced correctly (patient name, date, time, branch, amount). No raw template syntax visible. Proper Arabic grammar for context |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-NOT-006: Channel Fallback
| Field | Value |
|---|---|
| **ID** | TC-NOT-006 |
| **Title** | Notification channel fallback |
| **Description** | Verify fallback chain when primary channel fails |
| **Preconditions** | WhatsApp is primary channel, WhatsApp is unavailable |
| **Steps** | 1. Trigger notification 2. Simulate WhatsApp API timeout |
| **Expected Result** | Fallback chain: WhatsApp → SMS → Email → Push. First available channel delivers. Delivery status logged. Failed channels logged with reason |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-NOT-007: Notification Opt-Out
| Field | Value |
|---|---|
| **ID** | TC-NOT-007 |
| **Title** | Respect notification preferences |
| **Description** | Verify opted-out channels are not used |
| **Preconditions** | User has disabled SMS notifications |
| **Steps** | 1. Trigger notification for user 2. Verify channel selection |
| **Expected Result** | SMS channel skipped, notification sent via remaining enabled channels. Delivery preferences respected |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-NOT-008: Bulk Notification
| Field | Value |
|---|---|
| **ID** | TC-NOT-008 |
| **Title** | Bulk notification to multiple recipients |
| **Description** | Verify bulk notification delivery (e.g., promotional campaign) |
| **Preconditions** | Admin has created a bulk notification |
| **Steps** | 1. Create campaign targeting 1000 users 2. Send 3. Monitor delivery |
| **Expected Result** | Notifications queued, rate-limited per provider (10/s WhatsApp, 100/s email), delivery rate tracked, failed recipients logged for retry |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-NOT-009: Notification Delivery Log
| Field | Value |
|---|---|
| **ID** | TC-NOT-009 |
| **Title** | Notification delivery status is logged |
| **Description** | Verify comprehensive delivery logging |
| **Preconditions** | Notification has been sent |
| **Steps** | 1. Send notification 2. Check delivery log 3. Open notification detail |
| **Expected Result** | Log entry includes: notification ID, type, channel, recipient, status (sent/delivered/failed), timestamp, provider response, retry count. API available for log query |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-NOT-010: Multi-Language Notification
| Field | Value |
|---|---|
| **ID** | TC-NOT-010 |
| **Title** | Notification sends in user's preferred language |
| **Description** | Verify notifications respect user locale |
| **Preconditions** | Arabic user (ar-SA), English user (en-US) |
| **Steps** | 1. Trigger same notification for both users 2. Compare messages |
| **Expected Result** | Arabic user receives Arabic message with RTL formatting. English user receives English message with LTR formatting. Dates formatted per locale |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

---

## Module 6: Animation Components (15 Test Cases)

### TC-ANIM-001: Hero Section Entrance Animation
| Field | Value |
|---|---|
| **ID** | TC-ANIM-001 |
| **Title** | Hero section entrance animation plays correctly |
| **Description** | Verify hero banner entrance animation (fade + slide up) |
| **Preconditions** | User loads landing page for first time in session |
| **Steps** | 1. Navigate to `/` or `/ar` 2. Observe hero section 3. Refresh page 4. Observe again |
| **Expected Result** | Elements animate in sequence: background image (fade, 300ms), heading (slide up + fade, 500ms), subtitle (slide up + fade, 700ms), CTA buttons (scale in, 900ms). Animation plays only on first visit per session. No animation on subsequent visits |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-002: Parallax Scrolling Effect
| Field | Value |
|---|---|
| **ID** | TC-ANIM-002 |
| **Title** | Parallax scrolling effect on section backgrounds |
| **Description** | Verify parallax background layers scroll at different speeds |
| **Preconditions** | Page has parallax sections |
| **Steps** | 1. Navigate to landing page 2. Scroll down through parallax sections 3. Observe background movement |
| **Expected Result** | Background layers scroll at 50% rate of foreground (configurable), smooth 60fps animation, no jank, intersection observer triggers correctly |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-003: Glass Card Hover Effect
| Field | Value |
|---|---|
| **ID** | TC-ANIM-003 |
| **Title** | Glass morphism card hover animation |
| **Description** | Verify glass card hover effects (glow + lift + backdrop blur) |
| **Preconditions** | Page contains glass cards |
| **Steps** | 1. Hover over glass card 2. Observe effect 3. Move mouse away 4. Observe return to normal |
| **Expected Result** | On hover: card lifts 4px, glow border appears, backdrop blur increases, cursor changes. On mouse leave: smooth transition back (300ms ease-out). No boundary edge flash |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-004: Chart Animation - Line Chart
| Field | Value |
|---|---|
| **ID** | TC-ANIM-004 |
| **Title** | Line chart draws with animation |
| **Description** | Verify line chart data visualization with draw animation |
| **Preconditions** | Page has a line chart (e.g., results comparison) |
| **Steps** | 1. Navigate to results comparison page 2. Observe chart loading |
| **Expected Result** | Chart draws with progressive line animation (1-2s), axes labels fade in, points appear with scale animation, tooltip on hover, responsive to resize |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-005: Chart Animation - Bar Chart
| Field | Value |
|---|---|
| **ID** | TC-ANIM-005 |
| **Title** | Bar chart animates from baseline |
| **Description** | Verify bar chart growth animation |
| **Preconditions** | Page contains a bar chart |
| **Steps** | 1. Navigate to page with bar chart 2. Observe chart appearance |
| **Expected Result** | Bars grow from baseline to final height (staggered, 100ms delay between bars), color transitions for normal/abnormal ranges, data labels appear after bar settles |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-006: Cursor Effects
| Field | Value |
|---|---|
| **ID** | TC-ANIM-006 |
| **Title** | Custom cursor effects |
| **Description** | Verify custom cursor with ripple/glow effects |
| **Preconditions** | Custom cursor feature is enabled |
| **Steps** | 1. Move cursor across page 2. Hover over interactive elements 3. Click on elements |
| **Expected Result** | Custom cursor follows pointer with smooth lag (50ms), glow effect on hoverable elements, ripple on click, cursor hides on video playback, fallback to default cursor on mobile |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-007: Loading Skeleton Animation
| Field | Value |
|---|---|
| **ID** | TC-ANIM-007 |
| **Title** | Loading skeleton shimmer animation |
| **Description** | Verify skeleton loading animation matches content layout |
| **Preconditions** | Page with async data loading |
| **Steps** | 1. Navigate to page with slow data load 2. Observe loading state |
| **Expected Result** | Skeleton matches actual content layout (correct height/width per element), shimmer animation runs at 60fps, transitions smoothly to real content (no layout shift), skeleton width per content type correct |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-008: Page Transition Animation
| Field | Value |
|---|---|
| **ID** | TC-ANIM-008 |
| **Title** | Page transition between routes |
| **Description** | Verify SPA route transition animation |
| **Preconditions** | App is a SPA with route transitions |
| **Steps** | 1. Navigate from home page to appointments page 2. Navigate between nested routes |
| **Expected Result** | Old content fades out (200ms), loading indicator shows, new content fades in (300ms), no white flash, transition duration < 500ms total. Different transition for forward vs. backward navigation |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-009: Micro-interactions - Button Click
| Field | Value |
|---|---|
| **ID** | TC-ANIM-009 |
| **Title** | Button click ripple effect |
| **Description** | Verify ripple animation on button click |
| **Preconditions** | Interactive button element |
| **Steps** | 1. Click on primary button 2. Click on secondary button 3. Click on icon button |
| **Expected Result** | Ripple starts from click point, expands outward and fades (400ms total), no overflow beyond button bounds, works on all button variants |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-010: Micro-interactions - Form Field
| Field | Value |
|---|---|
| **ID** | TC-ANIM-010 |
| **Title** | Form field focus animation |
| **Description** | Verify form field label float and border highlight |
| **Preconditions** | Form with input fields |
| **Steps** | 1. Click into text field 2. Type value 3. Clear field 4. Tab to next field |
| **Expected Result** | Label animates up (200ms), border color changes to primary, helper text appears. Invalid state: shake animation (300ms), border turns red. No overlap with filled label |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-011: Progress Indicator
| Field | Value |
|---|---|
| **ID** | TC-ANIM-011 |
| **Title** | Stepped progress indicator animation |
| **Description** | Verify multi-step form progress animation |
| **Preconditions** | Multi-step process (e.g., booking flow) |
| **Steps** | 1. Step through booking wizard 2. Move forward and backward between steps |
| **Expected Result** | Current step highlighted with pulse, completed step shows checkmark with scale-in (300ms), connecting line animates between steps, backward navigation correctly deactivates steps |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-012: Toast/Notification Entry
| Field | Value |
|---|---|
| **ID** | TC-ANIM-012 |
| **Title** | Toast notification entry and exit animation |
| **Description** | Verify toast notification slide-in and auto-dismiss |
| **Preconditions** | Action that triggers a toast |
| **Steps** | 1. Trigger a success toast 2. Trigger an error toast 3. Observe timing |
| **Expected Result** | Toast slides in from top (RTL: left, LTR: right) over 300ms, auto-dismisses after 5s, slides out over 200ms, stacked toasts don't overlap, close button works. Error toasts: persist until dismissed |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-013: Modal/Dialog Animation
| Field | Value |
|---|---|
| **ID** | TC-ANIM-013 |
| **Title** | Modal open and close animation |
| **Description** | Verify modal dialog entry/exit animation |
| **Preconditions** | Page with modal trigger |
| **Steps** | 1. Click button to open modal 2. Close modal via X button 3. Close via backdrop click 4. Close via Escape key |
| **Expected Result** | Backdrop fades in (200ms), modal scales up from center (300ms, ease-out). Close: reverse animation (150ms). No scrollbar jump (scroll-locking). Focus trapped inside modal |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-014: Counter/Number Animation
| Field | Value |
|---|---|
| **ID** | TC-ANIM-014 |
| **Title** | Animated counter number display |
| **Description** | Verify stat counters animate from 0 to target value |
| **Preconditions** | Page with statistics counters |
| **Steps** | 1. Scroll to stats section (counters in viewport) 2. Observe count-up animation |
| **Expected Result** | Counters animate from 0 to final value with easing (duration proportional to value, min 1s max 3s), comma formatting applied, decimals handled correctly, triggers once on first viewport intersection |
| **Priority** | P3 |
| **Automation Status** | ✅ Automated |

### TC-ANIM-015: Reduced Motion Respect
| Field | Value |
|---|---|
| **ID** | TC-ANIM-015 |
| **Title** | All animations respect prefers-reduced-motion |
| **Description** | Verify all animations reduce/disable when user prefers reduced motion |
| **Preconditions** | OS-level "Reduce motion" setting enabled |
| **Steps** | 1. Enable prefers-reduced-motion in OS/browser 2. Navigate through all animated pages 3. Interact with animated elements |
| **Expected Result** | No animations play (static state only), fade transitions work (no slide/scale), no parallax, no auto-playing carousels, no shimmer on skeletons. All content still accessible and readable |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

---

## Module 7: Responsive & Mobile (10 Test Cases)

### TC-RSP-001: Mobile Viewport (320px-428px)
| Field | Value |
|---|---|
| **ID** | TC-RSP-001 |
| **Title** | All pages render correctly on mobile viewports |
| **Description** | Verify layout adapts to mobile screen sizes |
| **Preconditions** | None |
| **Steps** | 1. Set viewport to 375px × 812px (iPhone X) 2. Navigate to all page types 3. Verify no horizontal scroll |
| **Expected Result** | All content fits within viewport width (no horizontal scroll), font sizes >= 16px (prevent zoom), touch targets >= 44px, hamburger menu replaces nav, cards stack vertically, images scale down |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-RSP-002: Tablet Viewport (768px-1024px)
| Field | Value |
|---|---|
| **ID** | TC-RSP-002 |
| **Title** | All pages render correctly on tablet viewports |
| **Description** | Verify tablet layout breakpoints |
| **Preconditions** | None |
| **Steps** | 1. Set viewport to 768px × 1024px (iPad) 2. Navigate to all page types |
| **Expected Result** | Two-column layouts appear, navigation remains horizontal (no hamburger), sidebars show, modals appear as panels, data tables scroll horizontally if needed |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RSP-003: Desktop Viewport (1280px-1920px)
| Field | Value |
|---|---|
| **ID** | TC-RSP-003 |
| **Title** | All pages render correctly on desktop viewports |
| **Description** | Verify desktop layout at various widths |
| **Preconditions** | None |
| **Steps** | 1. Set viewport to 1440px × 900px 2. Set viewport to 1920px × 1080px 3. Navigate to all page types |
| **Expected Result** | Full multi-column layout, navigation visible, content centered with max-width container, whitespace balanced, no content stretching awkwardly |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RSP-004: RTL Layout
| Field | Value |
|---|---|
| **ID** | TC-RSP-004 |
| **Title** | RTL layout renders correctly across all breakpoints |
| **Description** | Verify Arabic RTL layout at all viewport sizes |
| **Preconditions** | Language set to Arabic (ar-SA) |
| **Steps** | 1. Set viewport to mobile 2. Navigate through key pages in Arabic 3. Switch to tablet 4. Switch to desktop |
| **Expected Result** | All text right-aligned, icons flipped for RTL (arrows, chevrons), form fields RTL-aware, date picker RTL, sidebar on right side, margin/padding swapped correctly, no LTR artifacts |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-RSP-005: Print Layout
| Field | Value |
|---|---|
| **ID** | TC-RSP-005 |
| **Title** | Print layout renders correctly |
| **Description** | Verify print-specific CSS for result PDFs and invoices |
| **Preconditions** | None |
| **Steps** | 1. Open result page 2. File → Print (or Ctrl+P) 3. Observe print preview |
| **Expected Result** | Print layout: no navigation/sidebar/footer visible, content fits page width, background colors preserved for charts (print-color-adjust), page breaks handled correctly, QR codes sharp, fonts embedded |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RSP-006: Touch Interactions
| Field | Value |
|---|---|
| **ID** | TC-RSP-006 |
| **Title** | Touch interactions work on mobile devices |
| **Description** | Verify touch events (tap, swipe, long press) function correctly |
| **Preconditions** | Touch-enabled device (mobile emulation) |
| **Steps** | 1. Tap on navigation links 2. Swipe on horizontal carousel 3. Long press on result item 4. Pinch on chart view |
| **Expected Result** | Tap targets respond immediately (no 300ms delay), swipe gesture recognized (horizontal carousel), long press shows context menu, pinch-to-zoom works on charts (prevent default on non-chart pages) |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-RSP-007: Keyboard Navigation
| Field | Value |
|---|---|
| **ID** | TC-RSP-007 |
| **Title** | Full keyboard navigation across all pages |
| **Description** | Verify all interactive elements are keyboard accessible |
| **Preconditions** | No mouse/touch input |
| **Steps** | 1. Tab through page elements 2. Use Enter/Space to activate 3. Use Escape to close modals/dropdowns 4. Use arrow keys in select/dropdown 5. Navigate entire booking flow via keyboard only |
| **Expected Result** | Visible focus indicator on all interactive elements, logical tab order (source order), skip-to-content link present, no focus trap (except modals where trap is correct), all actions possible via keyboard |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-RSP-008: Orientation Change
| Field | Value |
|---|---|
| **ID** | TC-RSP-008 |
| **Title** | Orientation change maintains state |
| **Description** | Verify screen orientation change preserves state and layout |
| **Preconditions** | Mobile viewport |
| **Steps** | 1. Load page in portrait 2. Fill in form partially 3. Rotate to landscape 4. Rotate back to portrait |
| **Expected Result** | Layout adapts to new orientation within 200ms, form state preserved, scroll position preserved, no layout shift or content loss |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RSP-009: Safe Area Insets
| Field | Value |
|---|---|
| **ID** | TC-RSP-009 |
| **Title** | Content respects safe area insets on notched devices |
| **Description** | Verify content avoids device notch and home indicator |
| **Preconditions** | Notched device emulation (iPhone X or similar) |
| **Steps** | 1. Set viewport to iPhone X/XR/12/14 2. Navigate through pages 3. Observe edge margins |
| **Expected Result** | Content extends behind notch (for background/banner) but critical content (text, buttons, nav) respects safe-area-inset. Home indicator does not overlap interactive elements. Status bar space respected |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

### TC-RSP-010: PWA Manifest Verification
| Field | Value |
|---|---|
| **ID** | TC-RSP-010 |
| **Title** | PWA manifest and service worker function correctly |
| **Description** | Verify PWA capabilities (install prompt, offline, splash screen) |
| **Preconditions** | Site meets PWA criteria |
| **Steps** | 1. Verify manifest.json 2. Verify service worker registration 3. Trigger install prompt 4. Test offline page 5. Check splash screen colors/icons |
| **Expected Result** | manifest.json: correct name, short_name, icons, start_url, display: standalone, theme_color, background_color. Service worker: caches static assets, serves offline page when offline, updates on new version. Install prompt: fires when criteria met (visited twice, 5 min apart) |
| **Priority** | P2 |
| **Automation Status** | ✅ Automated |

---

## Module 8: Security (10 Test Cases)

### TC-SEC-001: SQL Injection Prevention
| Field | Value |
|---|---|
| **ID** | TC-SEC-001 |
| **Title** | SQL injection attempts are blocked |
| **Description** | Verify all input fields are protected against SQL injection |
| **Preconditions** | None |
| **Steps** | 1. Identify all input fields across the application 2. Submit `' OR 1=1 --` in text fields 3. Submit `'; DROP TABLE users; --` in search fields 4. Attempt SQLi via URL parameters 5. Attempt SQLi via API JSON body |
| **Expected Result** | All SQLi attempts return 400 Bad Request or are safely escaped, no SQL errors leaked in responses, no data corruption, no unexpected query behavior |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated (OWASP ZAP) |

### TC-SEC-002: XSS Prevention
| Field | Value |
|---|---|
| **ID** | TC-SEC-002 |
| **Title** | Cross-site scripting attacks are blocked |
| **Description** | Verify all input fields are protected against XSS |
| **Preconditions** | None |
| **Steps** | 1. Submit `<script>alert('xss')</script>` in all text fields 2. Submit `<img src=x onerror=alert(1)>` in profile fields 3. Submit `javascript:alert(1)` in URL fields 4. Attempt stored XSS via API |
| **Expected Result** | All script tags and event handlers are HTML-escaped when rendered, Content-Security-Policy blocks inline scripts, no script execution in browser, X-XSS-Protection header present |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated (OWASP ZAP) |

### TC-SEC-003: IDOR Prevention
| Field | Value |
|---|---|
| **ID** | TC-SEC-003 |
| **Title** | Insecure direct object reference is prevented |
| **Description** | Verify users cannot access resources belonging to other users |
| **Preconditions** | User A and User B both have results/appointments |
| **Steps** | 1. Log in as User A 2. Capture result/appointment ID 3. Attempt to access User B's resource by changing ID 4. Attempt via API directly |
| **Expected Result** | 403 Forbidden for unauthorized resource access, no PHI leaked in error message, consistent authorization check on all endpoints with owner/context validation |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-SEC-004: Rate Limiting
| Field | Value |
|---|---|
| **ID** | TC-SEC-004 |
| **Title** | Rate limiting protects sensitive endpoints |
| **Description** | Verify rate limiting on auth and OTP endpoints |
| **Preconditions** | None |
| **Steps** | 1. Send 6 rapid login requests for same account 2. Send 10 rapid OTP requests to same phone 3. Send 100 rapid API requests from same IP |
| **Expected Result** | After 5 login attempts: account locked for 15 min, response 429. After 5 OTP requests: OTP endpoint blocks for 1h, response 429. After 100 requests from same IP: 429 with Retry-After header. Rate limit headers (X-RateLimit-*) present on all responses |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-SEC-005: CORS Configuration
| Field | Value |
|---|---|
| **ID** | TC-SEC-005 |
| **Title** | CORS headers are correctly configured |
| **Description** | Verify CORS policy allows only authorized origins |
| **Preconditions** | None |
| **Steps** | 1. Send request from `https://attacker.com` 2. Send request from `https://app.almokhtabar.com` 3. Send preflight OPTIONS request |
| **Expected Result** | Attacker origin: no Access-Control-Allow-Origin header, response blocked by browser. Valid origin: proper CORS headers returned. Credentials allowed only for specific origins (not wildcard). Preflight OPTIONS responds correctly |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-SEC-006: JWT Security
| Field | Value |
|---|---|
| **ID** | TC-SEC-006 |
| **Title** | JWT tokens are secure against common attacks |
| **Description** | Verify JWT implementation follows best practices |
| **Preconditions** | None |
| **Steps** | 1. Decode access token and inspect payload 2. Attempt "alg: none" attack 3. Attempt to use access token after logout 4. Tamper with payload claims 5. Check token expiry enforcement |
| **Expected Result** | Token payload does not contain sensitive data (no PHI, no passwords). "alg: none" tokens rejected (401). Logged-out tokens invalidated. Tampered tokens rejected (invalid signature). Expired tokens return 401. Short TTL (access: 15min, refresh: 7d) |
| **Priority** | P0 |
| **Automation Status** | ✅ Automated |

### TC-SEC-007: Mass Assignment Protection
| Field | Value |
|---|---|
| **ID** | TC-SEC-007 |
| **Title** | Mass assignment is prevented on all endpoints |
| **Description** | Verify users cannot modify fields they shouldn't have access to |
| **Preconditions** | Authenticated user (non-admin) |
| **Steps** | 1. Send PUT/PATCH request to profile with extra fields: `{"role": "admin", "is_verified": true}` 2. Send POST to appointment with internal fields 3. Attempt to set `balance` field on self |
| **Expected Result** | Extra fields silently ignored (not applied), whitelist-based field validation on all endpoints, no privilege escalation possible via field injection |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-SEC-008: Secure Headers Audit
| Field | Value |
|---|---|
| **ID** | TC-SEC-008 |
| **Title** | Security headers are present and correct |
| **Description** | Verify all required security headers are set |
| **Preconditions** | None |
| **Steps** | 1. Send GET request to any page 2. Inspect response headers |
| **Expected Result** | Headers present: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Content-Security-Policy: ...`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0` (deprecated but present), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: ...`, `Cache-Control: no-store` for auth pages |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-SEC-009: Audit Logging
| Field | Value |
|---|---|
| **ID** | TC-SEC-009 |
| **Title** | Security-relevant events are logged |
| **Description** | Verify audit logging for critical actions |
| **Preconditions** | None |
| **Steps** | 1. Perform login (success + failure) 2. View patient result 3. Create/modify/delete appointment 4. Process payment 5. Admin changes user role |
| **Expected Result** | All events logged with: timestamp, user ID, action, resource type, resource ID, IP address, user agent, result (success/failure). Logs immutable (append-only). Logs accessible only to authorized admins. Logs retained per compliance (HIPAA: 6 years) |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

### TC-SEC-010: Session Management
| Field | Value |
|---|---|
| **ID** | TC-SEC-010 |
| **Title** | Session management follows security best practices |
| **Description** | Verify session creation, validation, and termination |
| **Preconditions** | User is logged in |
| **Steps** | 1. Inspect session cookie attributes 2. Log out and attempt to reuse session 3. Close browser and reopen (no session persistence) 4. Test concurrent session limit |
| **Expected Result** | Cookies: HttpOnly, Secure, SameSite=Strict/Lax, Path=/, domain scoped. Logout: server invalidates session, client clears cookies. No session reuse after logout. No persistent session across browser restart. Max 5 concurrent sessions enforced |
| **Priority** | P1 |
| **Automation Status** | ✅ Automated |

---

## Appendix A: Test Case Summary

| Module | Total | Automated | Manual | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|---|---|
| Auth | 20 | 19 | 1 | 2 | 8 | 9 | 1 |
| Appointments | 15 | 15 | 0 | 1 | 6 | 8 | 0 |
| Results | 15 | 14 | 1 | 2 | 3 | 8 | 2 |
| Payments | 20 | 20 | 0 | 1 | 11 | 8 | 0 |
| Notifications | 10 | 10 | 0 | 1 | 3 | 5 | 1 |
| Animation Components | 15 | 15 | 0 | 0 | 0 | 3 | 12 |
| Responsive & Mobile | 10 | 10 | 0 | 0 | 4 | 6 | 0 |
| Security | 10 | 10 | 0 | 4 | 5 | 1 | 0 |
| **Total** | **115** | **113** | **2** | **11** | **40** | **48** | **16** |

## Appendix B: Test Case ID Convention

```
TC-{MODULE}-{NNN}

Module Codes:
AUTH  = Authentication/Authorization
APT   = Appointments
RES   = Results
PAY   = Payments
NOT   = Notifications
ANIM  = Animation Components
RSP   = Responsive & Mobile
SEC   = Security
```

## Appendix C: Priority Definition

| Priority | Label | Definition |
|---|---|---|
| P0 | Critical | Must pass before any deployment. Core functionality that blocks all users. |
| P1 | High | Must pass before major release. Important feature with high user impact. |
| P2 | Medium | Should pass. Non-critical feature or edge case with workaround. |
| P3 | Low | Nice to have. Cosmetic, minor UX, or rare edge cases. |
