---
name: radial-bloom-redesign
description: User wants to replace the SVG tree with a radial bloom diagram (flower from above) and restructure the app into landing + app views
type: feedback
---

User wants a major frontend restructure:

1. **Two-mode app**: Landing page (marketing/CTA) vs App (authenticated experience)
   - Landing: hero with sky, CTA buttons, connect wallet
   - Top-left: Login button → when logged in shows "Hi [username]" + "Go to App"
   - App view: only accessible when wallet connected

2. **Replace SVG tree with Radial Bloom Diagram**:
   - Flower viewed from above — organic, flat, pastel
   - Center circle = the donor
   - Each petal radiating outward = an NGO they've donated to
   - Petals subdivide into smaller segments = how funds were allocated
   - Leaf nodes at tips = final expenditures, tap for details
   - Maps 1:1 to the DonorTree data structure
   - Style with botanical greens, warm canvas, subtle petal shapes
   - Much easier to build in SVG than a naturalistic tree
   - Use pastel colors that fit the solarpunk aesthetic

**Why:** The naturalistic SVG tree was complex to build and maintain. The radial bloom is more modern, easier to implement, and still feels organic/botanical. It's essentially a sunburst/radial chart but styled as a flower.

**How to apply:** Build as a single SVG component. Center = donor stats. First ring = NGO petals (sized by donation amount). Second ring = spending allocations. Outer ring = individual expenditures. Use CSS transitions for hover/select states.
