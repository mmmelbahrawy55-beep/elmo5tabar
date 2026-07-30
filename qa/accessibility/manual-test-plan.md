# Accessibility Manual Test Plan — Al Mokhtabar Laboratory

## Scope
Manual accessibility validation for all patient-facing pages (auth, appointments, results, payments, profile) and admin dashboard. Testing covers WCAG 2.1 Level AA compliance with specific focus on KSA/MENA user requirements.

## Prerequisites
- Screen readers: VoiceOver (macOS), NVDA (Windows), JAWS (Windows)
- Browser: Chrome, Firefox, Safari (latest versions)
- Tools: Color Contrast Analyser, Accessibility Insights, WAVE toolbar
- Test accounts: patient, doctor, admin (3 roles)

---

## 1. Screen Reader Testing

### 1.1 VoiceOver (macOS + Safari)
| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Page structure navigation | Use VO+Left/Right to navigate through all elements | All interactive elements announced correctly | Pass/Fail |
| Landmarks navigation | VO+U to open rotor, navigate landmarks | All regions (banner, main, navigation, contentinfo) present | Pass/Fail |
| Headings navigation | VO+Command+H to jump between headings | Logical heading hierarchy, no gaps | Pass/Fail |
| Form inputs | Tab through form fields, VO reads labels | All inputs have associated labels | Pass/Fail |
| Dynamic content | Trigger modal, VO reads new content | Focus moves to new content, announcements made | Pass/Fail |
| RTL support | Set OS language to Arabic, navigate site | Correct right-to-left reading order | Pass/Fail |
| Table navigation | Navigate test results table | Row/column headers announced | Pass/Fail |

### 1.2 NVDA (Windows + Chrome/Firefox)
| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Page load | Press Insert+DownArrow to read continuously | Complete page read without skipping | Pass/Fail |
| Links list | Insert+F7 to open elements list | All links have meaningful text | Pass/Fail |
| Form mode | Tab into search field | NVDA enters forms mode automatically | Pass/Fail |
| Error announcements | Submit empty form | Error messages read automatically | Pass/Fail |
| Progress updates | Check queue position updates | Live region updates announced | Pass/Fail |

### 1.3 JAWS (Windows + Chrome)
| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Page scan | Insert+Ctrl+S to scan page | All elements categorized correctly | Pass/Fail |
| Reading order | Arrow down through page | Logical reading order matches visual | Pass/Fail |
| Dialog handling | Open appointment modal | Focus trapped in modal, Escape closes | Pass/Fail |

---

## 2. Keyboard Navigation

### 2.1 Core Navigation
| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Skip navigation | Press Tab on page load | Skip link visible and functional | Pass/Fail |
| Tab order | Tab through all interactive elements | Logical order matching visual layout | Pass/Fail |
| Tab trap | Tab through modal/dialog | Focus cycles within modal, does not escape | Pass/Fail |
| Back to top | Tab to "Back to top" link after long content | Function works | Pass/Fail |

### 2.2 Interactive Controls
| Control | Keys | Expected | Result |
|---------|------|----------|--------|
| Buttons | Enter/Space | Activates button action | Pass/Fail |
| Links | Enter | Navigates to target | Pass/Fail |
| Dropdowns | Enter to open, Arrow keys to navigate, Enter to select | All options accessible | Pass/Fail |
| Date picker | Tab to field, Enter to open calendar, Arrow keys, Escape to close | Date selected without mouse | Pass/Fail |
| Tabs | Tab to tablist, Arrow keys to switch tabs, Tab into content | Tab switching + content navigation | Pass/Fail |
| Accordion | Tab to header, Enter/Space to expand/collapse | Content toggles, focus stays | Pass/Fail |
| Checkboxes | Tab to input, Space to toggle | Checked state toggles audibly | Pass/Fail |
| Radio buttons | Tab to group, Arrow keys to select | Selection changes with audio feedback | Pass/Fail |
| Slider | Tab to slider, Arrow keys to adjust, Home/End for extremes | Value updates announced | Pass/Fail |

---

## 3. Focus Indicators

| Test | Criteria | Expected | Result |
|------|----------|----------|--------|
| Focus visibility | Tab through every interactive element | Visible focus ring on all elements (min 2px, contrast ratio >= 3:1) | Pass/Fail |
| Focus order | Tab through page in RTL mode | Logical RTL focus order | Pass/Fail |
| Focus trapping | Open modal, Tab repeatedly | Focus stays within modal | Pass/Fail |
| Focus restoration | Close modal, check focus location | Focus returns to trigger element | Pass/Fail |
| Skip link focus | Press Tab on load, Enter | Focus jumps to main content | Pass/Fail |
| Custom components | Tab through custom select, datepicker | All custom elements receive focus | Pass/Fail |

---

## 4. Zoom and Responsive

| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| 200% zoom | Browser zoom to 200% | All content visible, no horizontal scroll | Pass/Fail |
| 400% zoom | Browser zoom to 400% | Core functionality remains usable | Pass/Fail |
| Text spacing | Apply browser "Text Spacing" bookmarklet | No truncated text, overlapping, or clipping | Pass/Fail |
| Mobile viewport | Resize to 320px width | No content loss, hamburger menu works | Pass/Fail |
| Tablet viewport | Resize to 768px width | Layout adapts, touch targets adequate | Pass/Fail |

---

## 5. Reduced Motion

| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| OS reduced motion | Enable "Reduce motion" in OS settings | All animations disabled, no jarring transitions | Pass/Fail |
| Page transitions | Navigate between pages | No sliding/fading animations | Pass/Fail |
| Loading spinners | Submit form, wait for response | Static indicator, no spinning | Pass/Fail |
| Queue animation | Check queue position display | No pulsing/flashing elements | Pass/Fail |
| Notification banners | Trigger a notification | Static appearance, no slide-in | Pass/Fail |

---

## 6. High Contrast Mode

| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Windows High Contrast | Enable Windows High Contrast Black/White | All text readable, all interactive elements visible | Pass/Fail |
| Forced colors | Use prefers-color-scheme override | No information conveyed by color alone | Pass/Fail |
| Custom themes | Apply dark mode | Sufficient contrast in all themes | Pass/Fail |
| Icons and symbols | Navigate using only icons | Icons visible and distinguishable | Pass/Fail |
| Form field borders | Tab through form | Field borders visible in high contrast | Pass/Fail |

---

## 7. RTL Screen Reader Testing

| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Arabic announcements | Set screen reader language to Arabic | Arabic text read with correct pronunciation | Pass/Fail |
| Mixed content | Page with English/Arabic mixed text | Language switches announced correctly | Pass/Fail |
| Number direction | Phone numbers, dates, prices | Numbers read in correct direction | Pass/Fail |
| Quran/Hijri dates | Display Islamic calendar dates | Correct date format reading | Pass/Fail |
| ID numbers | National ID input field | Numbers read digit by digit | Pass/Fail |

---

## 8. Form Error Announcements

| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Inline errors | Submit form with empty required fields | Error messages appear inline, announced by screen reader | Pass/Fail |
| Error summary | Submit with multiple errors | List of all errors at top of form, focus moves to summary | Pass/Fail |
| Live validation | Type invalid email format | Error announced immediately via aria-live | Pass/Fail |
| Success confirmation | Submit valid form | Success message announced | Pass/Fail |
| Password requirements | Type weak password | Specific requirements listed and announced | Pass/Fail |

---

## 9. Heading Hierarchy

| Page | Heading Structure | Expected | Result |
|------|-------------------|----------|--------|
| Homepage | h1: "Al Mokhtabar" → h2: section titles | No skipped levels | Pass/Fail |
| Login | h1: "Login" → no other headings | Single h1 is correct | Pass/Fail |
| Appointments | h1: "Book Appointment" → h2: "Select Branch", "Select Test", "Choose Time" | Consistent structure | Pass/Fail |
| Results | h1: "Lab Results" → h2: date groupings → h3: individual tests | Logical nesting | Pass/Fail |
| Payments | h1: "Payment" → h2: Invoice, Payment Method, Confirmation | Clear hierarchy | Pass/Fail |
| Admin | h1: "Admin Dashboard" → h2: analytics cards → h3: chart titles | Structure maintained | Pass/Fail |

---

## 10. Link Purpose in Context

| Test | Steps | Expected | Result |
|------|-------|----------|--------|
| Link text | Read all links on page | No "click here", "read more", "here" without context | Pass/Fail |
| Icon links | Links with only icon | aria-label provides purpose | Pass/Fail |
| Download links | Result PDF links | Indicates file type and size | Pass/Fail |
| External links | Links leaving platform | Indicates external navigation | Pass/Fail |
| Same-page links | Anchor navigation | Clear destination text | Pass/Fail |
| Redundant links | Same URL repeated | Consistent text across occurrences | Pass/Fail |

---

## 11. Additional WCAG Checks

| Check | Criteria | Expected | Result |
|-------|----------|----------|--------|
| Language attribute | `<html>` element | Correct lang attribute set per page (ar/en) | Pass/Fail |
| Page title | `<title>` element | Unique, descriptive title per page | Pass/Fail |
| Iframe titles | Embedded maps/videos | All iframes have title attributes | Pass/Fail |
| ARIA landmarks | `<nav>`, `<main>`, `<aside>` etc. | All content within meaningful landmarks | Pass/Fail |
| Skip link | First focusable element | Visible on focus, links to main content | Pass/Fail |
| Tables | Data tables | `<th>` with scope attributes, `<caption>` if needed | Pass/Fail |
| Lists | Menu items, test lists | Proper `<ul>`/`<ol>` markup | Pass/Fail |
| Status messages | Loading, saving, confirming | role="status" or aria-live="polite" | Pass/Fail |
| Alerts | Error, warning messages | role="alert" on important messages | Pass/Fail |
| Progress bars | File upload, payment processing | role="progressbar" with aria-valuenow | Pass/Fail |

---

## Test Execution

1. Run automated axe tests first (`npm run test:a11y`)
2. Execute each manual test case above
3. Log results as Pass/Fail with notes
4. Critical failures block release
5. Serious failures must be fixed within 1 sprint
6. Re-run automated + manual tests after fixes

## Reporting

- Create a test run sheet for each sprint
- Track violation remediation in project tracker
- Include screenshots for visual issues
- Document screen reader version and OS for reproducibility

---

*Template: Copy this document for each test cycle. Replace "Result" with Pass/Fail/NA and add notes.*
