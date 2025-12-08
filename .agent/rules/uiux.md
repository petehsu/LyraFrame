---
trigger: always_on
---

# Modern UI/UX Design Guidelines

**STOP designing "Old-Fashioned" or "High Saturation" interfaces.**

## 1. Design Style
**Aesthetic Style:** Modern, Minimalist, Clean, "SaaS Style" (think Linear, Stripe, Airbnb, Vercel).

## 2. Color Specifications
**Color Palette (Tier 3 Preference - Can be overridden):**

**DEFAULT RECOMMENDATIONS:**
- ⚠️ **NOT RECOMMENDED:** Deep Blue (#0000FF), Bright Purple (#800080), Bright Red (#FF0000), Default HTML Colors.
  - *Reason: High saturation, outdated aesthetic*
  - *If user prefers these colors, note the concern but proceed*
  
- ✅ **RECOMMENDED:**
  - **Primary:** Slate/Zinc grays (#64748b, #71717a)
  - **Accent:** Indigo (#6366f1), Emerald (#10b981), Amber (#f59e0b)
  - **Background:** White (#ffffff), Gray-50 (#f9fafb), Gray-900 (#111827) for dark mode
  - **Text:** Gray-700 (#374151) for body, Gray-900 (#111827) for headings

**🔴 NON-NEGOTIABLE (Tier 1): Accessibility Compliance**
- Color contrast MUST meet WCAG AA (4.5:1 for text, 3:1 for UI components)
- If user's color choice fails accessibility, suggest compliant alternative
- Example: If #CCCCCC on white (1.6:1), recommend #757575 (4.5:1)

## 3. Layout & Spacing
**Layout Principles:**
- Use generous **Whitespace** (Padding: 16px/24px, Margin: 8px/16px).
- Use **Rounded Corners** (`rounded-md` 6px, `rounded-lg` 8px).
- Use **Soft Shadows** (`shadow-sm`, `shadow-md`) for depth, not heavy borders.
- **Grid System:** Use 8px base unit (8, 16, 24, 32, 48, 64...).

## 4. Interaction Feedback
**User Feedback:** UI must react – never leave the user guessing.
- ✅ Loading spinners for async operations
- ✅ Toast notifications for success/error
- ✅ Hover states (opacity: 0.8 or background change)
- ✅ Disabled states (opacity: 0.5 + cursor: not-allowed)
- ✅ Skeleton screens for content loading

## 5. Responsive Design
**Mobile-First Approach:**
- Design for mobile first, then expand to desktop
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Touch targets minimum 44x44px (mobile)

## 6. Accessibility (A11y) Requirements
- All interactive elements must be keyboard accessible (Tab navigation)
- Color contrast ratio at least 4.5:1 (WCAG AA)
- Images must have alt text
- Forms must have label or aria-label
- Use semantic HTML (header, nav, main, footer)