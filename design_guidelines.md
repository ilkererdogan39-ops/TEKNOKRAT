# Design Guidelines: Corporate Training Management System (LMS)

## Design Approach
**Design System**: Carbon Design System (IBM) - optimized for data-heavy enterprise applications with clear information hierarchy and professional aesthetics.

**Key Principles**:
- Clarity and efficiency for enterprise users
- Data-first design with strong visual hierarchy
- Professional, trustworthy interface
- Accessibility and usability at scale

## Typography
**Font Family**: IBM Plex Sans (primary), system fallback
- **Headings**: 
  - H1: 2.5rem (40px), semibold
  - H2: 2rem (32px), semibold
  - H3: 1.5rem (24px), medium
  - H4: 1.25rem (20px), medium
- **Body**: 1rem (16px), regular
- **Labels/UI**: 0.875rem (14px), medium
- **Small text**: 0.75rem (12px), regular

## Layout System
**Spacing Scale**: Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Page padding: `p-6` (mobile), `p-8` (desktop)
- Section gaps: `gap-8`
- Component spacing: `mb-6`, `mt-4`
- Card padding: `p-6`
- Table cell padding: `px-4 py-3`

**Grid System**: 
- Max container width: `max-w-7xl`
- Dashboard cards: 2-4 columns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)

## Core Components

### Landing Page
- Full-viewport hero section (80vh minimum)
- Centered content with system illustration/abstract graphic (no photo)
- Two prominent role cards side-by-side (Admin/Participant)
- Cards: Glass-morphism effect with subtle backdrop blur
- Single primary CTA per card

### Authentication
- Centered auth box (max-w-md)
- Clean form layout with generous spacing (`space-y-6`)
- Input fields with clear labels above
- Full-width primary button
- Secondary "back" link below

### Dashboard Layout
- **Header**: Fixed top bar with logo, user info, logout (h-16)
- **Sidebar Navigation**: Left sidebar (w-64) for main sections (optional for single-page tabs)
- **Tab Navigation**: Horizontal tabs below header for Admin sections
- **Content Area**: White card container with shadow
- **Stats Grid**: 3-4 stat cards showing key metrics (total users, active trainings, completion rate)

### Data Tables
- Zebra striping for row distinction
- Sticky header on scroll
- Action buttons in last column (icon buttons)
- Pagination controls at bottom
- Search/filter bar above table

### Forms & Modals
- Modal overlay: Semi-transparent dark backdrop
- Modal content: White card, centered, max-w-2xl
- Form groups with consistent spacing (`space-y-4`)
- Multi-select with clear visual indicators
- Action buttons right-aligned at bottom

### Video Player
- 16:9 aspect ratio container
- Full-width embedded player
- Progress tracking bar below player
- "Mark as Complete" button below video

### Progress Indicators
- Linear progress bars for training completion
- Percentage display alongside bar
- Success state when 100% complete

## Interactions
- Hover states: Subtle elevation change on cards/buttons
- Focus states: 2px outline in primary color
- Loading states: Subtle spinner for async operations
- Toast notifications: Bottom-right, 4-second display

## Responsive Behavior
- **Mobile** (< 768px): Single column, stacked navigation, hamburger menu
- **Tablet** (768-1024px): 2-column grids, visible sidebar
- **Desktop** (> 1024px): Full layout with multi-column grids

## Images
**No hero images** - Use abstract illustrations or icon-based graphics instead:
- Landing page: Abstract geometric pattern or training/education icon illustration
- Empty states: Custom illustrations for "no trainings assigned" or "no users yet"
- User avatars: Initials in circular containers with varied background colors

## Accessibility
- All interactive elements keyboard navigable
- ARIA labels on icon-only buttons
- Form validation messages below inputs
- Minimum contrast ratio 4.5:1
- Focus visible on all interactive elements

## Special Considerations
- Turkish language support throughout
- CSV import with drag-drop zone
- Bulk operations with multi-select checkboxes
- Role-based UI variations (Admin vs Participant views)
- Print-friendly report layouts