# Notion AI Prompts for Database Creation

Copy and paste these prompts into Notion AI (press spacebar or `/ai` in Notion) to create each database.

## Database 1: Wardrobe

```
Create a database table called "Wardrobe" with the following columns:

1. Name (Title) - required
2. Category (Select) - required, options: top, bottom, outerwear, dress, shoes, bag, accessory
3. Image (Files) - for uploading item photos
4. Colors (Multi-select) - required, for color tags
5. Pattern (Select) - required, options: solid, striped, checked, floral, graphic, other
6. Material (Select) - optional, for material type
7. Season (Multi-select) - required, options: summer, autumn, winter, spring, all-season
8. Formality (Select) - required, options: 1-casual, 2-smart-casual, 3-business-casual, 4-business, 5-formal
9. Fit_Notes (Text) - optional, for fit and sizing notes
10. Purchase_Link (URL) - optional
11. Status (Select) - required, default: active, options: active, archived

Make sure all select fields have the exact options listed above.
```

## Database 2: Style Inspo

```
Create a database table called "Style Inspo" with the following columns:

1. Name (Title) - required
2. Image (Files) - required, for inspiration images
3. Vibe_Tags (Multi-select) - required, for style tags like minimalist, boho, preppy, edgy
4. Like (Checkbox) - required, checkbox to mark if I like this style
5. Why (Text) - optional, what I like/dislike about this outfit
6. Source_URL (URL) - optional, where I found this inspiration

Make sure the Like field is a checkbox.
```

## Database 3: Outfit Requests

```
Create a database table called "Outfit Requests" with the following columns:

1. Request_Date (Date) - optional
2. Context (Text) - required, for outfit context like "Dinner at nice restaurant, 28C, smart casual"
3. Constraints (Text) - optional, for hard rules like "No wool, must be comfortable"
4. Number_of_Options (Number) - default: 5, how many outfit options to generate
5. Status (Select) - required, default: pending, options: pending, processing, done, error
6. Error_Message (Text) - optional, auto-populated if error occurs
7. Generated_Outfits (Relation) - relation to "My Outfits" database (create that database first or add this relation after)

Make sure Status default is set to "pending" and has all the options listed.
```

## Database 4: My Outfits

```
Create a database table called "My Outfits" with the following columns:

1. Name (Title) - required
2. Created (Created time) - auto-populated
3. Request (Relation) - relation to "Outfit Requests" database
4. Items_JSON (Text) - for raw JSON reference
5. Top (Relation) - relation to "Wardrobe" database, optional
6. Bottom (Relation) - relation to "Wardrobe" database, optional
7. Dress (Relation) - relation to "Wardrobe" database, optional
8. Outerwear (Relation) - relation to "Wardrobe" database, optional
9. Shoes (Relation) - relation to "Wardrobe" database, required
10. Accessories (Relation) - relation to "Wardrobe" database, optional, allow multiple relations
11. Rationale (Text) - AI-generated explanation
12. Status (Select) - default: generated, options: generated, worn, retired

Make sure Accessories allows multiple relations and all relation fields point to the Wardrobe database.
```

## Database 5: Worn Today

```
Create a database table called "Worn Today" with the following columns:

1. Date (Date) - required
2. Outfit (Relation) - relation to "My Outfits" database, required
3. Rating (Select) - required, options: 1, 2, 3, 4, 5
4. What_Worked (Text) - optional
5. What_Didnt (Text) - optional
6. Notes (Text) - optional
7. Weather (Text) - optional
8. Occasion (Text) - optional

Make sure Rating has options 1 through 5.
```

## After Creating All Databases

After creating all 5 databases, you need to:

1. **Connect your Notion integration** to each database:
   - Open each database
   - Click the "..." menu → "Connections"
   - Add your "Wardrobe Stylist" integration (create this first in notion.so/my-integrations)

2. **Set up the relations**:
   - In "Outfit Requests", set "Generated_Outfits" to relate to "My Outfits"
   - In "My Outfits", set "Request" to relate to "Outfit Requests"
   - All item relations in "My Outfits" should point to "Wardrobe"
   - In "Worn Today", set "Outfit" to relate to "My Outfits"

3. **Get database IDs**:
   - Open each database in Notion
   - Look at the URL: `https://www.notion.so/workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
   - Copy the 32-character ID (with dashes) for each database
