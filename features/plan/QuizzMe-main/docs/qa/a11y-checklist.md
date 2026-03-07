# Accessibility Checklist - Character Sheet (TS-6)

## WCAG AA Compliance Checklist

### Color & Contrast (NFR-1)

- [ ] **Text Contrast**: All body text meets 4.5:1 contrast ratio
  - Text color (#271C16 / #053B3F) on light backgrounds (#F9F7F1)
  - Verified with contrast checker tools
  - No body text uses gold as primary color

- [ ] **UI Control Contrast**: Interactive elements meet 3:1 contrast
  - Buttons and links have sufficient contrast
  - Form inputs meet requirements
  - Icons and graphical elements are distinguishable

- [ ] **Color Independence**: Information not conveyed by color alone
  - Delta indicators show both color AND symbols (+/-)
  - Chart axes labeled with text, not just color
  - Error states include text descriptions

### Motion & Animation (NFR-2)

- [ ] **Reduced Motion Support**: `prefers-reduced-motion` media query implemented
  - All animations respect user preference
  - Reduced motion animations ≤250ms
  - No orbit/jitter effects in reduced mode
  - Crossfade and number tweens only

- [ ] **Animation Duration Constraints**:
  - Standard mode: 450ms - 1400ms (based on delta magnitude)
  - Reduced mode: ≤250ms for all transitions
  - Auto-dismiss timers still functional (8-12s)

- [ ] **No Vestibular Triggers**:
  - No parallax scrolling
  - No spinning/rotating elements
  - No rapid flashing (<3 flashes per second)

### Keyboard Navigation

- [ ] **Keyboard Accessibility**:
  - All interactive elements accessible via Tab
  - Logical tab order (follows visual hierarchy)
  - No keyboard traps
  - Skip links for main content (optional)

- [ ] **Focus Indicators**:
  - Visible focus states on all interactive elements
  - Focus ring visible against all backgrounds
  - Focus indicators not removed by CSS
  - Custom focus styles meet 3:1 contrast

- [ ] **Keyboard Shortcuts** (if applicable):
  - Documented and non-conflicting
  - Can be disabled/remapped if needed

### Touch Targets (Mobile)

- [ ] **Minimum Size**: All touch targets ≥44x44px
  - Buttons meet minimum size
  - Links have adequate padding
  - Icon buttons expanded if needed

- [ ] **Spacing**: Adequate spacing between interactive elements
  - Minimum 8px between adjacent targets
  - Prevents accidental activation

### Screen Reader Support

- [ ] **Semantic HTML**:
  - Proper heading hierarchy (h1 → h2 → h3)
  - Landmark regions (header, main, footer)
  - Lists use proper list markup
  - Tables use proper table markup (if applicable)

- [ ] **ARIA Labels**:
  - Stat bars: `aria-label="Clarity: 75 out of 100"` or `role="meter"`
  - Progress indicators have aria-valuenow/min/max
  - Icon buttons have aria-label
  - Hidden decorative elements: `aria-hidden="true"`

- [ ] **Dynamic Content**:
  - Delta updates use `aria-live="polite"`
  - Banner announcements don't interrupt
  - Loading states announced
  - Error messages announced

- [ ] **Alternative Text**:
  - Ornaments: `aria-hidden="true"` (decorative)
  - Avatar images: descriptive alt text
  - Icons: text alternatives or aria-label

### Content & Structure

- [ ] **Heading Structure**:
  - Single h1 per page ("Dein Character Sheet")
  - Section headings use h2/h3
  - No skipped heading levels

- [ ] **Link Purpose**:
  - Link text descriptive (not just "click here")
  - External links indicated
  - New window/tab warnings

- [ ] **Form Labels** (if applicable):
  - All inputs have associated labels
  - Required fields marked
  - Error messages clear and specific

### Responsive & Zoom

- [ ] **Text Zoom**: Content remains functional at 200% zoom
  - No horizontal scrolling at 200%
  - Text doesn't overlap
  - Layout adapts gracefully

- [ ] **Reflow**: Content reflows at 320px viewport width
  - Mobile layout works at small sizes
  - No two-dimensional scrolling required

- [ ] **Font Sizing**:
  - Base font size ≥16px
  - Relative units (rem/em) used
  - Text can be resized without breaking layout

## Testing Tools Checklist

### Automated Testing

- [ ] **Lighthouse Accessibility Score ≥90** (SC-3)
  - Run on /character route
  - Fix all high-priority issues
  - Document any acceptable exceptions

- [ ] **axe DevTools**:
  - No critical or serious issues
  - Review moderate issues
  - Document minor issues

- [ ] **WAVE Browser Extension**:
  - No errors (red icons)
  - Review alerts (yellow icons)
  - Verify contrast passes

### Manual Testing

- [ ] **Keyboard Navigation Test**:
  - Unplug mouse, navigate site with keyboard only
  - Can reach all interactive elements
  - Modals can be closed with Escape
  - Focus visible at all times

- [ ] **Screen Reader Test**:
  - NVDA (Windows) or VoiceOver (Mac)
  - All content announced correctly
  - Headings navigable
  - Landmark navigation works
  - Forms are usable

- [ ] **Zoom Test**:
  - Browser zoom to 200%
  - Layout remains functional
  - Text readable
  - No content cut off

- [ ] **Reduced Motion Test**:
  - Enable OS-level reduced motion
  - Verify animations respect preference
  - No jarring motion
  - Crossfade transitions only

- [ ] **Color Blindness Simulation**:
  - Test with color blindness simulator
  - Verify information still conveyed
  - Check deuteranopia, protanopia, tritanopia

### Device Testing

- [ ] **Mobile Devices**:
  - iOS Safari (iPhone)
  - Android Chrome
  - Touch targets adequate
  - No horizontal scroll

- [ ] **Tablet**:
  - iPad Safari
  - Android tablet
  - Layout adapts correctly

- [ ] **Desktop Browsers**:
  - Chrome
  - Firefox
  - Safari
  - Edge

## Implementation Notes

### Framer Motion Reduced Motion

```tsx
import { useReducedMotion } from 'framer-motion';

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();

  const transition = shouldReduceMotion
    ? { duration: 0.15 } // ≤250ms
    : { duration: 0.8, ease: 'easeOut' };

  return <motion.div transition={transition}>...</motion.div>;
}
```

### CSS Media Query Alternative

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### ARIA Live Region Example

```tsx
<div aria-live="polite" aria-atomic="true">
  {deltaMessage && <p>{deltaMessage}</p>}
</div>
```

### Focus Styles

```css
/* Gold focus ring for light theme */
.focus-visible:focus {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

/* Ensure visible on all backgrounds */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(var(--gold-primary-rgb), 0.5);
}
```

## Success Criteria Verification

### SC-3: Lighthouse Accessibility Score ≥90

**Test Procedure**:
1. Open Chrome DevTools
2. Navigate to /character
3. Run Lighthouse audit (Accessibility category)
4. Verify score ≥90
5. Address any flagged issues

**Expected Results**:
- Overall score: ≥90/100
- Color contrast: Pass
- ARIA: Pass
- Names and labels: Pass
- Navigation: Pass
- Best practices: Pass

### SC-4: No UI Crashes with Missing Fields

**Test Cases**:
- ✅ Profile without `archetype_params`
- ✅ Profile without `narrative_snippet`
- ✅ Profile without `last_delta`
- ✅ Profile without `secondary_archetypes`
- ✅ All stats at 0
- ✅ All stats at 1

All test cases covered in `/src/components/character/__tests__/CharacterSheet.test.tsx`

## Automated Test Commands

```bash
# Run all tests
npm run test

# Run accessibility-specific tests
npm run test -- accessibility.test.tsx

# Run with coverage
npm run test:coverage

# Lighthouse CI (if configured)
npm run lighthouse

# axe automated tests (if configured)
npm run test:a11y
```

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Framer Motion Accessibility](https://www.framer.com/motion/accessibility/)
- [Testing Library Accessibility](https://testing-library.com/docs/queries/about/#priority)

## Sign-off

- [ ] All critical issues resolved
- [ ] Lighthouse score ≥90
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Reduced motion verified
- [ ] Touch targets verified
- [ ] Manual testing completed
- [ ] Documented any known limitations

**Tested By**: _________________
**Date**: _________________
**Lighthouse Score**: _____/100
