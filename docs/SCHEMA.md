# Notion Database Schemas

This document describes the exact schema for all 5 Notion databases required for the Wardrobe Stylist.

## Database 1: Wardrobe

**Purpose**: Store all clothing items with metadata

### Properties

| Property Name | Type | Options/Notes |
|--------------|------|---------------|
| `Name` | Title | Required - Item name (e.g., "White Cotton T-Shirt") |
| `Category` | Select | Required - Options: `top`, `bottom`, `outerwear`, `dress`, `shoes`, `bag`, `accessory` |
| `Image` | Files | Upload item photos or product images |
| `Colors` | Multi-select | Required - Color tags (e.g., "white", "navy", "black") |
| `Pattern` | Select | Required - Options: `solid`, `striped`, `checked`, `floral`, `graphic`, `other` |
| `Material` | Select | Optional - Material type (e.g., "cotton", "silk", "denim") |
| `Season` | Multi-select | Required - Options: `summer`, `autumn`, `winter`, `spring`, `all-season` |
| `Formality` | Select | Required - Options: `1-casual`, `2-smart-casual`, `3-business-casual`, `4-business`, `5-formal` |
| `Fit_Notes` | Rich Text | Optional - Notes about fit, sizing, etc. |
| `Purchase_Link` | URL | Optional - Link to where item was purchased |
| `Status` | Select | Required - Options: `active`, `archived` (default: `active`) |

### Example Entry

- **Name**: "Classic White Button-Down Shirt"
- **Category**: `top`
- **Colors**: `white`
- **Pattern**: `solid`
- **Material**: `cotton`
- **Season**: `all-season`
- **Formality**: `3-business-casual`
- **Status**: `active`

---

## Database 2: Style Inspo

**Purpose**: Store inspiration images and style preferences

### Properties

| Property Name | Type | Options/Notes |
|--------------|------|---------------|
| `Name` | Title | Required - Description of the outfit/inspiration |
| `Image` | Files | Required - Inspiration image(s) |
| `Vibe_Tags` | Multi-select | Required - Style tags (e.g., "minimalist", "boho", "preppy", "edgy") |
| `Like` | Checkbox | Required - Check if you like this style |
| `Why` | Rich Text | Optional - What you like/dislike about this outfit |
| `Source_URL` | URL | Optional - Where you found this inspiration |

### Example Entry

- **Name**: "Minimalist Summer Outfit"
- **Vibe_Tags**: `minimalist`, `summer`, `casual`
- **Like**: ✓ (checked)
- **Why**: "Love the clean lines and neutral palette"

---

## Database 3: Outfit Requests

**Purpose**: Trigger outfit generation with context

### Properties

| Property Name | Type | Options/Notes |
|--------------|------|---------------|
| `Request_Date` | Date | Optional - Date for the outfit |
| `Context` | Rich Text | **Required** - Context for outfit (e.g., "Dinner at nice restaurant, 28C, smart casual, avoid black") |
| `Constraints` | Rich Text | Optional - Hard rules (e.g., "No wool", "Must be comfortable", "Avoid heels") |
| `Number_of_Options` | Number | Default: `5` - How many outfit options to generate |
| `Status` | Select | Required - Options: `pending`, `processing`, `done`, `error` (default: `pending`) |
| `Error_Message` | Rich Text | Auto-populated if Status = `error` |
| `Generated_Outfits` | Relation | Target: `My Outfits` - Auto-populated with created outfits |

### Example Entry

- **Context**: "Dinner at nice restaurant, 28C, smart casual, avoid black"
- **Constraints**: "No wool, must be comfortable for walking"
- **Number_of_Options**: `5`
- **Status**: `pending`

---

## Database 4: My Outfits

**Purpose**: Store AI-generated outfit combinations

### Properties

| Property Name | Type | Options/Notes |
|--------------|------|---------------|
| `Name` | Title | Required - Outfit name (e.g., "Casual Summer Brunch") |
| `Created` | Created Time | Auto-populated |
| `Request` | Relation | Target: `Outfit Requests` - Links back to original request |
| `Items_JSON` | Rich Text | Raw JSON for reference (technical) |
| `Top` | Relation | Target: `Wardrobe` - Optional |
| `Bottom` | Relation | Target: `Wardrobe` - Optional |
| `Dress` | Relation | Target: `Wardrobe` - Optional (use if dress instead of top+bottom) |
| `Outerwear` | Relation | Target: `Wardrobe` - Optional |
| `Shoes` | Relation | Target: `Wardrobe` - Required |
| `Accessories` | Relation | Target: `Wardrobe` - Optional (multi-relation) |
| `Rationale` | Rich Text | AI-generated explanation of why this outfit works |
| `Status` | Select | Options: `generated`, `worn`, `retired` (default: `generated`) |

### Example Entry

- **Name**: "Smart Casual Dinner"
- **Top**: [White Button-Down Shirt]
- **Bottom**: [Navy Trousers]
- **Shoes**: [Brown Leather Loafers]
- **Rationale**: "This outfit balances formality with comfort. The white shirt provides a crisp base, navy trousers add sophistication, and brown loafers keep it relaxed yet polished."

---

## Database 5: Worn Today

**Purpose**: Feedback loop for style learning

### Properties

| Property Name | Type | Options/Notes |
|--------------|------|---------------|
| `Date` | Date | Required - Date outfit was worn |
| `Outfit` | Relation | Target: `My Outfits` - Required |
| `Rating` | Select | Required - Options: `1`, `2`, `3`, `4`, `5` (1 = didn't like, 5 = loved it) |
| `What_Worked` | Rich Text | Optional - What you liked about the outfit |
| `What_Didnt` | Rich Text | Optional - What didn't work |
| `Notes` | Rich Text | Optional - Additional notes |
| `Weather` | Rich Text | Optional - Weather conditions |
| `Occasion` | Rich Text | Optional - Where/when you wore it |

### Example Entry

- **Date**: 2024-01-15
- **Outfit**: [Smart Casual Dinner]
- **Rating**: `4`
- **What_Worked**: "Comfortable and appropriate for the occasion"
- **What_Didnt**: "Felt a bit too formal, could have been more relaxed"
- **Weather**: "28C, sunny"
- **Occasion**: "Dinner at restaurant"

---

## Database Relations

```
Outfit Requests
  └─> Generated_Outfits → My Outfits
       └─> Request → Outfit Requests (back reference)

My Outfits
  ├─> Top → Wardrobe
  ├─> Bottom → Wardrobe
  ├─> Dress → Wardrobe
  ├─> Outerwear → Wardrobe
  ├─> Shoes → Wardrobe
  └─> Accessories → Wardrobe (multi)

Worn Today
  └─> Outfit → My Outfits
```

## Setup Checklist

- [ ] Create all 5 databases in Notion
- [ ] Add all required properties with correct types
- [ ] Configure select options exactly as specified
- [ ] Set up relations between databases
- [ ] Connect Notion integration to all databases
- [ ] Test by creating a sample wardrobe item
- [ ] Test by creating a sample outfit request

## Tips

1. **Use consistent naming**: Keep property names exactly as shown (case-sensitive)
2. **Multi-select options**: You can add custom options beyond the defaults
3. **Images**: Upload high-quality images for better AI understanding
4. **Relations**: Make sure relations are bidirectional where needed
5. **Defaults**: Set sensible defaults (e.g., Status = `active` for Wardrobe)
