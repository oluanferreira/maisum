# Landing Pattern — Landing Page Section Structure

> **Task ID:** ux-landing-pattern
> **Agent:** UX-Design Expert (Sati)
> **Version:** 1.0.0
> **Owner:** ux-design-expert
> **Consumers:** dev, architect, ux-design-expert, pm
> **Elicit:** false
> **Category:** design-patterns

---

## Purpose

Provide a complete landing page section structure and pattern recommendations for a given type. Returns recommended sections in order, key elements per section, conversion tips, mobile-first considerations, and a section-by-section wireframe description. Data sourced from `landing-patterns.csv` and `landing-principles.csv`.

---

## Inputs

| Field | Type | Required | Source | Validation |
|-------|------|----------|--------|------------|
| `type` | string | yes | User Input | Landing type: "SaaS", "e-commerce", "portfolio", "startup", "agency", "app", "newsletter", "event", "nonprofit" |
| `mode` | string | no | User Input | `yolo` \| `interactive`. Default: `yolo` |
| `goal` | string | no | User Input | Primary conversion goal: "signup", "purchase", "download", "contact", "subscribe". Default: inferred from type |
| `sections` | number | no | User Input | Max number of sections. Default: determined by type (typically 7-12) |

---

## Execution Flow

### 1. Load Pattern Data
1.1. Read `.lmas-core/development/data/ux/sub-skills/landing-patterns.csv`
1.2. Read `.lmas-core/development/data/ux/sub-skills/landing-principles.csv`
1.3. Parse rows — patterns CSV columns: type, section_name, section_order, elements, purpose, conversion_tip, mobile_notes
1.4. Parse rows — principles CSV columns: principle, description, applies_to, priority
1.5. Validation: Both CSVs loaded. If missing, use built-in defaults for common landing types.

### 2. Match Landing Type
2.1. Filter `landing-patterns.csv` rows where `type` matches input (case-insensitive)
2.2. If no exact match → fuzzy match on type and related tags
2.3. Sort matched sections by `section_order` ascending
2.4. If `sections` param provided → trim to that count (keep highest-priority sections)
2.5. Validation: At least 5 sections matched

### 3. Load Conversion Principles
3.1. Filter `landing-principles.csv` for principles matching the type
3.2. Sort by priority (1 = most critical)
3.3. Extract top 5 principles for the final output
3.4. Map principles to their relevant sections
3.5. Validation: At least 3 principles loaded

### 4. Build Section Sequence
4.1. For each section in order, compile:
   - **Section name** (e.g., "Hero", "Social Proof", "Features")
   - **Purpose** — why this section exists in the funnel
   - **Key elements** — what goes in this section (headline, image, CTA, etc.)
   - **Conversion tip** — how to optimize this section for the goal
   - **Mobile-first notes** — how this section adapts on mobile
4.2. Assign a wireframe layout description to each section:
   - Layout type: full-width, two-column, grid, centered, asymmetric
   - Content zones: text block, image/video, CTA area, badge/trust area
   - Estimated viewport height: 60vh, 80vh, 100vh, auto
4.3. Validation: Every section has all 5 fields populated

### 5. Generate Mobile-First Considerations
5.1. Stack all multi-column layouts to single column
5.2. Ensure CTA is visible within first viewport (above fold)
5.3. Recommend touch-friendly tap targets (min 44x44px)
5.4. Specify image lazy-loading priorities (hero=eager, below-fold=lazy)
5.5. Recommend font size minimums (heading 24px+, body 16px+)
5.6. Validation: Mobile notes present for every section

### 6. Generate Wireframe Descriptions
6.1. For each section, write a text-based wireframe description:
   ```
   [HERO — 100vh]
   ┌──────────────────────────────┐
   │  [Logo]          [Nav links] │
   │                              │
   │     Headline (H1, 48px)      │
   │     Subheadline (18px)       │
   │     [Primary CTA Button]     │
   │                              │
   │     [Hero Image/Video]       │
   └──────────────────────────────┘
   ```
6.2. Include responsive breakpoint notes
6.3. Validation: All sections have wireframe descriptions

### 7. Format Output
7.1. Assemble complete landing page blueprint
7.2. Include section sequence table
7.3. Include conversion principles sidebar
7.4. Include mobile adaptation summary
7.5. Include implementation notes for developers

---

## Output Format

```markdown
## 📄 Landing Page: {type}

**Goal:** {goal} | **Sections:** {count} | **Est. scroll depth:** {X viewports}

### Section Sequence
| # | Section | Purpose | Key Elements | Conversion Tip |
|---|---------|---------|--------------|----------------|
| 1 | Hero | First impression, value prop | H1, subheadline, CTA, hero image | CTA above fold, single clear action |
| 2 | Social Proof | Build trust | Logos, testimonials, metrics | Show numbers (users, revenue, stars) |
| ... | ... | ... | ... | ... |

### Wireframe Descriptions
{text-based wireframe per section}

### Conversion Principles
1. **{principle}** — {description}
2. ...

### Mobile-First Checklist
- [ ] Hero CTA visible in first viewport
- [ ] All tap targets >= 44x44px
- [ ] Images use responsive srcset
- [ ] Font sizes: heading >= 24px, body >= 16px
- [ ] Lazy loading on below-fold images

### Developer Implementation Notes
- Recommended framework components per section
- Suggested Tailwind utility patterns
- Animation/intersection observer hints
```

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| CSV not found | Landing data CSVs missing from `sub-skills/` | Use built-in defaults for SaaS, e-commerce, portfolio. Warn user about missing data. |
| Unknown type | Landing type not in CSV | Suggest closest match, fall back to "SaaS" as most generic |
| Too few sections | `sections` param < 3 | Warn minimum is 3 (Hero + Content + CTA). Force minimum. |
| Missing principles | Principles CSV empty for type | Use universal conversion principles |

---

## Examples

### Example 1: SaaS Landing

```
*landing SaaS
```

Returns: 10-section blueprint — Hero, Social Proof (logos), Problem/Solution, Features (3-col grid), How It Works, Pricing, Testimonials, FAQ, Final CTA, Footer.

### Example 2: Portfolio with Goal

```
*landing portfolio --goal=contact
```

Returns: 7-section blueprint — Hero (name + tagline), Selected Work (grid), About, Skills/Tools, Process, Contact CTA, Footer.

### Example 3: Startup Compact

```
*landing startup --sections=6
```

Returns: Trimmed 6-section blueprint with only highest-priority sections for early-stage startup.

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - .lmas-core/development/data/ux/sub-skills/landing-patterns.csv
  - .lmas-core/development/data/ux/sub-skills/landing-principles.csv
tags:
  - ux
  - landing-page
  - conversion
  - wireframe
  - data-driven
updated_at: 2026-03-17
```
