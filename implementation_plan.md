# AH Brand - Dashboard Redesign Plan

The goal is to redesign the entire dashboard layout, colors, and aesthetics to match the sleek, modern light-mode "Delisas" dashboard provided in the image, while adapting the content to fit the AH Brand Inventory System.

## User Review Required
> [!IMPORTANT]
> The current system uses a **Dark Mode / High-Contrast** theme (Black, Yellow/Neon). The provided image uses a clean **Light Mode** theme (White, Off-white background, Blue primary color). 
> This plan will **completely change the colors** of the entire system to match the provided image. Do you approve this complete aesthetic shift to Light Mode?

## Proposed Changes

### 1. Global Colors & Theme (`src/app/globals.css`)
- **[MODIFY]** Change root CSS variables to match the image:
  - `--background`: `#f8f9fc` (Light greyish blue)
  - `--sidebar-bg`: `#ffffff` (Pure white)
  - `--foreground`: `#1f2937` (Dark grey for text)
  - `--primary`: `#2563eb` (Vibrant blue, matching the charts and active states)
  - Card backgrounds: `#ffffff` with subtle shadows.

### 2. Layout Structure (`src/app/dashboard/layout.tsx`)
- **[MODIFY]** Adjust the layout to have a clean white sidebar on the left and an off-white main content area.
- Add a top header inside the main content area (Search bar, Bell Icon, Export CSV, and `+ Create Sale` button).

### 3. Sidebar (`src/components/SidebarClient.tsx`)
- **[MODIFY]** Redesign the sidebar:
  - Background: White.
  - Links text color: Grey.
  - Active Link: Light blue background with bold blue text/icon.
  - Move the user profile section to the bottom of the sidebar with a dropdown arrow, exactly like the image.

### 4. Dashboard Main Page (`src/app/dashboard/page.tsx`)
- **[MODIFY]** Rebuild the main dashboard grid to exactly replicate the image's structure:
  - **Top Metrics (4 Cards)**:
    1. Total Revenue
    2. Total Sales (replaces Total Shipment)
    3. Total Inventory (replaces Total Orders)
    4. Low Stock Alerts (replaces Avg Delivery Time)
    - Add the green/red rounded percentage pills.
  - **Charts Section**:
    - Add a "Total Sale" vertical bar chart using Recharts (similar style to image).
    - Add a "Sales by Category" horizontal bar chart (replacing Country Redistribution).
  - **Bottom Table**:
    - Replace the current minimal lists with a "Recent Sales List" table (matching the "Shipping Products List" style: Checkboxes, Tracking ID, Customer, Cost, Status Pills).

### 5. Loading Animation (`src/app/loading.tsx`)
- **[MODIFY]** Update the colors of the custom "Bag Animation" loader to match the new Blue/White theme, ensuring it remains the official loading page as requested ("شنطه بيتحط فيها حاجات كدا").

## Verification Plan
1. Ensure all existing functional links in the sidebar still work correctly.
2. Verify that light mode text is fully readable and accessible.
3. Test the new layout responsiveness on mobile (sidebar collapsing).
