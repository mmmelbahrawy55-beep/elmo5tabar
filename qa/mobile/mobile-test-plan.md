# Mobile Test Plan - Al Mokhtabar Laboratory

## Overview

Comprehensive mobile testing strategy covering both React Native (iOS/Android) and Flutter (cross-platform) applications. Tests validate functionality, performance, reliability, and user experience across the supported device matrix.

## Scope

- **React Native App** (iOS + Android): Patient-facing mobile application
- **Flutter App** (iOS + Android): Cross-platform internal application
- **Shared Test Scenarios**: Common functionality across both apps

## Device Matrix

| Device | OS | Screen Size | DPI | Notes |
|--------|-----|-------------|-----|-------|
| iPhone 15 | iOS 17 | 6.1" | 460 | Primary iOS device |
| Samsung Galaxy S24 | Android 14 | 6.2" | 425 | Primary Android device |
| Google Pixel 8 | Android 14 | 6.2" | 427 | Secondary Android |
| Huawei P60 | HarmonyOS 4 | 6.67" | 444 | Chinese market |
| OnePlus 12 | Android 14 | 6.82" | 510 | Large screen |
| iPad Pro 12.9" | iPadOS 17 | 12.9" | 264 | Tablet testing |
| Samsung Tab S9 | Android 14 | 11" | 274 | Android tablet |

## Test Areas

### 1. Authentication & Onboarding
- Splash screen display and timing
- Phone number verification flow
- OTP auto-read via SMS
- Biometric registration (Face ID / Fingerprint)
- Biometric login flow
- Passwordless login via magic link
- Session persistence after app restart
- Multi-device session handling
- Account deactivation flow

### 2. Appointment Booking
- Branch selection with map integration
- Doctor search with filters
- Calendar navigation (Gregorian and Hijri)
- Time slot availability display
- Booking confirmation with push notification
- Reschedule flow with conflict detection
- Cancel with reason selection
- Queue position updates via WebSocket
- Walk-in registration flow
- Video consultation room entry

### 3. Lab Results
- PDF rendering and zoom
- Push notification on result ready
- Summary view with color-coded indicators
- Historical trend charts (offline cached)
- Share result via WhatsApp / Email
- Doctor notes display with expandable sections
- Critical value alert with highlighted background
- Comparison with previous results

### 4. Payments & Wallet
- Credit card entry with OCR
- Mada / Apple Pay / Google Pay integration
- Wallet balance display and refresh
- Top-up via SADAD / direct debit
- Coupon code validation
- Subscription management view
- Auto-renewal toggle
- Invoice PDF generation and download
- Gift card redemption
- Payment receipt via email

### 5. Notifications
- Push notification registration
- In-app notification center
- Deep linking from notification to specific page
- Notification categories (results, appointments, payments, promotions)
- Notification preferences management
- Silent push for data sync
- Notification grouping by patient ID
- Actionable notifications (confirm/cancel)

### 6. Offline Mode Testing
- Offline login with cached credentials
- Cached appointment list display
- Cached results display
- Queue submission when back online
- Conflict resolution with server sync
- Cache invalidation strategy
- Storage limit enforcement
- Offline indicator UI
- Reconnection retry mechanism
- Data consistency checks after sync

### 7. Push Notification Testing
- Registration with FCM/APNs token
- Notification receipt on foreground
- Notification receipt on background
- Notification tap → deep link
- Notification dismissal
- Rich media notifications (images)
- Notification badges
- Notification permission prompts
- Opt-out flow
- Notification history after reinstall

### 8. Biometric Authentication
- Face ID enrollment flow
- Fingerprint enrollment flow
- Biometric authentication on app launch
- Fallback to PIN when biometric fails
- Biometric timeout enforcement
- Re-enrollment after OS-level change
- Biometric for payment confirmation
- Error handling for locked biometric
- Accessibility for biometric alternatives

### 9. Deep Linking Testing
- Universal Links (iOS) / App Links (Android) configuration
- Link from SMS to specific appointment
- Link from email to specific result
- Link from push notification
- Link from WhatsApp message
- Link to public test result (shared)
- Link with invalid/expired tokens
- Fallback to web browser
- Deep link from third-party apps

### 10. Background/Foreground Lifecycle
- App background → foreground → state preservation
- App killed → relaunch → session restore
- Long background period → token refresh
- Background data fetch
- Background upload of pending actions
- Interruption handling (call, SMS)
- Multi-window support on tablets
- Screen orientation change preservation
- Low memory warning handling
- App state restoration after crash

### 11. Network Condition Simulation
- 3G network (500kbps, 200ms latency)
- 4G network (10Mbps, 50ms latency)
- 5G network (100Mbps, 10ms latency)
- High latency (500ms+)
- Packet loss (2%, 5%, 10%)
- Network flakiness (intermittent connection)
- Airplane mode → offline behavior
- WiFi to cellular handoff
- Network speed change mid-operation
- DNS failure handling
- CDN fallback behavior

### 12. Performance Testing
- App cold start time (< 2s)
- App warm start time (< 1s)
- Screen transition animation (60fps)
- Scroll performance (lists, feeds)
- Image loading and caching
- Memory usage baseline and peak
- CPU usage during operations
- Battery drain per session
- Network request coalescing
- Database query performance
- Animation frame drops during transitions

### 13. Battery Impact Testing
- Background battery drain (24h)
- Battery consumption per notification received
- Screen-on battery usage per 10min session
- GPS usage during branch finder
- Bluetooth low energy for queue beacons
- Location services impact
- Push notification battery overhead
- Data sync battery cost
- Video consultation battery usage
- Comparison against industry benchmarks

### 14. Memory Leak Detection
- Navigate through all screens → memory delta
- Open/close modals repeatedly
- Infinite scroll lists
- Image gallery browsing
- PDF view and dismiss
- Payment flow repeated x10
- Socket connection/disconnection cycle
- Notification banner display/dismiss
- Tab switching in dashboard
- Memory warning response behavior

## Test Execution Strategy

### Automation
- Appium with WebDriverIO for UI automation
- Detox for React Native integration tests
- Flutter Driver / integration_test for Flutter
- BrowserStack for device cloud execution
- Parallel execution across device matrix

### CI/CD Integration
- Tests run on every PR to `develop` branch
- Full regression nightly on `main` branch
- Smoke tests on every commit
- Performance benchmarks compared against baseline
- Failure screenshots and video artifacts uploaded

### Reporting
- Allure framework for test reporting
- Trend charts for performance metrics
- Crash rate dashboard
- Flaky test detection and auto-retry
- Jira integration for bug tracking

## Environment Setup

```bash
# iOS (XCUITest)
xcode-select --install
brew install carthage
npm install -g appium
appium driver install xcuitest

# Android (UiAutomator2)
npm install -g appium
appium driver install uiautomator2

# Device Cloud
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_key"
```

## Test Data Management

- Test patient accounts with known credentials
- Seeded appointments, results, and invoices
- Mock payment gateway (Stripe test mode)
- Disposable phone numbers for OTP verification
- Test notification tokens for push testing
- Dynamic test data generation for performance tests
- Data cleanup after test runs
- Separate test database instance
