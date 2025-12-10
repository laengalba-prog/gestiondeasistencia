# Design Guidelines: La Engalba Class Management System

## Design Approach

**Selected Approach:** Hybrid - Functional web application with established brand identity

This is a utility-focused class management application requiring clear information hierarchy and efficient user workflows. The existing color palette and branding elements are preserved while enhancing usability and visual polish.

---

## Core Design Elements

### A. Typography

**Font Family:**
- Primary: 'Montserrat', sans-serif (already specified)
- Fallback: system-ui, -apple-system, sans-serif

**Hierarchy:**
- Page titles (h1): text-3xl, font-bold
- Section headers (h2): text-2xl, font-semibold  
- Subsections (h3): text-xl, font-medium
- Body text: text-base, font-normal
- Labels/metadata: text-sm, font-medium
- Small print/footer: text-xs

### B. Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 8, 12, 16, 20**
- Component padding: p-4, p-8
- Section spacing: mb-8, mb-12
- Card internal spacing: p-6
- Form field gaps: gap-4
- Calendar cell padding: p-4

**Container Strategy:**
- Main content: max-w-6xl mx-auto px-4
- Forms: max-w-md for login, max-w-2xl for admin forms
- Calendar tables: full-width within container

### C. Component Library

**Navigation:**
- Fixed top navigation with logo left, links right
- Transparent background with slight backdrop blur
- Active state underline for current section
- Mobile: hamburger menu collapsing to drawer

**Authentication Forms:**
- Centered card layout with subtle shadow
- Single column, max-width 400px
- Input fields with clear focus states
- Primary CTA button full-width
- Secondary actions as text links below

**Calendar Views:**
- Table-based layout with clear grid lines
- Sticky header row for day/time labels
- Minimum cell height for touch targets (min-h-16)
- Color-coded cells with text contrast checking:
  - Occupied: Orange background (#EE7D2D)
  - Available: Light green (#14A781)
  - Pending recovery: Dark green (#376953)
- View toggle (Weekly/Monthly) as segmented control top-right

**Student Dashboard:**
- Class status cards in grid (2 columns desktop, 1 mobile)
- Quick action buttons below calendar
- Cancel/Reserve buttons with confirmation modals
- Visual countdown timers for time-sensitive actions

**Admin Panel:**
- Form-first layout for creating classes
- Occupancy table showing fraction notation (6/7)
- Batch operations checkboxes for multi-class management
- Visual capacity indicators (progress bars showing 6/7 filled)

**Buttons:**
- Primary: Solid orange (#EE7D2D) with white text
- Secondary: Outline purple (#B5AAD2) with purple text
- Destructive: Red for cancel actions
- Rounded corners: rounded-lg
- Padding: px-6 py-3

**Modals:**
- Centered overlay with backdrop blur
- Max-width 500px
- Header with title and close button
- Content area with generous padding (p-8)
- Footer with action buttons right-aligned

**Status Indicators:**
- Small badges for class counts
- Pill-shaped with matching calendar colors
- Position top-right of calendar cells

### D. Color Application

**Brand Colors (Already Defined):**
- Primary Purple: #B5AAD2 (navigation, headers)
- Secondary Orange: #EE7D2D (CTAs, occupied slots)
- Dark Green: #376953 (recovery pending)
- Light Green: #14A781 (available slots)
- Background: #E0D0E7 (page background)

**Usage:**
- Navigation/Footer: Purple background, white text
- Page background: Light purple (#E0D0E7)
- Cards/Forms: White background with subtle shadow
- Calendar cells: Status-specific colors
- Text: #333 on light backgrounds, white on colored backgrounds

---

## Images

**No hero images required** - This is a functional web application focused on calendar management and bookings. 

**Optional brand element:** Small logo image (50px height) in top-left navigation, linking to home/login.

---

## Animations

**Minimal and Purposeful:**
- Fade-in for modals (150ms)
- Smooth toggle between weekly/monthly views (200ms transition)
- Button hover lift (2px transform) with 100ms duration
- No scroll animations or elaborate transitions

---

## Key Interaction Patterns

- Click calendar cell to view details/book
- Time-based button enabling/disabling (2-hour cancel rule, 30-min booking rule)
- Inline validation for forms with clear error states
- Toast notifications for success/error feedback (top-right, auto-dismiss 3s)
- Confirmation modals for destructive actions (cancel class)