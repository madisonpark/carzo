# Tutorial: Adding a New Filter

Learn full-stack development by adding a "Body Style" filter to the search page.

## What You'll Learn

- Add UI filter component
- Update API endpoint
- Preserve filter in URL
- Test the feature end-to-end

## Prerequisites

- Completed [Getting Started](./getting-started.md) tutorial
- Basic React knowledge
- Understanding of URL search parameters

---

## Scenario

Users want to filter vehicles by body style (Sedan, SUV, Truck, etc.). We'll add this filter to the search sidebar.

---

## Step 1: Examine Existing Filters

### Check FilterSidebar Component

```bash
code components/Search/FilterSidebar.tsx
```

**Look for existing filters:**
- Make dropdown
- Model dropdown
- Price range inputs
- Condition checkboxes

We'll add Body Style following the same pattern.

---

## Step 2: Check Database Schema

```bash
psql $NEXT_PUBLIC_SUPABASE_URL -c "
SELECT DISTINCT body_style
FROM vehicles
WHERE is_active = true
ORDER BY body_style;
"
```

**Expected values:**
```
Sedan
SUV
Truck
Coupe
Convertible
Wagon
Hatchback
```

Good! The `body_style` column exists and has data.

---

## Step 3: Update Filter Options API

### Edit get_filter_options Function

```bash
# Check if body_styles already returned
psql $NEXT_PUBLIC_SUPABASE_URL -c "
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_filter_options_by_location';
"
```

**The function should already return body_styles!** Verify:

```sql
SELECT body_styles FROM get_filter_options_by_location(33.749, -84.388);
```

If body_styles is already included, skip to Step 4. Otherwise, update the function.

---

## Step 4: Add Body Style Filter UI

### Edit FilterSidebar Component

```typescript
// components/Search/FilterSidebar.tsx

// Add state for body style
const [bodyStyle, setBodyStyle] = useState<string>('');

// Add body style to URL params
useEffect(() => {
  const params = new URLSearchParams(searchParams.toString());

  if (make) params.set('make', make);
  if (model) params.set('model', model);
  if (bodyStyle) params.set('bodyStyle', bodyStyle);  // Add this
  // ... other filters

  router.push(`/search?${params.toString()}`);
}, [make, model, bodyStyle, /* other dependencies */]);

// Add body style dropdown to JSX
<div className="space-y-4">
  {/* Existing filters */}

  {/* Body Style Filter */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Body Style
    </label>
    <select
      value={bodyStyle}
      onChange={(e) => setBodyStyle(e.target.value)}
      className="w-full rounded-lg border border-border px-4 py-2"
    >
      <option value="">All Body Styles</option>
      {filterOptions?.body_styles?.map((style: string) => (
        <option key={style} value={style}>
          {style}
        </option>
      ))}
    </select>
  </div>
</div>
```

---

## Step 5: Update Search API

### Edit Search Vehicles Endpoint

```typescript
// app/api/search-vehicles/route.ts

// Add bodyStyle to request schema
const SearchRequestSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  bodyStyle: z.string().optional(),  // Add this
  condition: z.string().optional(),
  // ... other fields
});

// Pass bodyStyle to Supabase RPC
const { data, error } = await supabase.rpc('search_vehicles_by_location', {
  user_lat: userLat,
  user_lon: userLon,
  p_make: make,
  p_model: model,
  p_body_style: bodyStyle,  // Add this
  p_condition: condition,
  // ... other params
});
```

---

## Step 6: Test the Filter

### Start Dev Server

```bash
npm run dev
```

### Test in Browser

1. Go to http://localhost:3000/search
2. Open Body Style dropdown
3. Select "SUV"
4. Verify:
   - URL updates to `/search?bodyStyle=SUV`
   - Results filter to SUVs only
   - Count updates

### Test URL Persistence

1. Navigate to `/search?bodyStyle=Sedan`
2. Verify filter pre-selected
3. Verify results show sedans

### Test Filter Combinations

```
/search?make=Toyota&bodyStyle=SUV
/search?make=Ford&model=F-150&bodyStyle=Truck
```

---

## Step 7: Add Clear Filters Button

### Update Clear Handler

```typescript
// components/Search/FilterSidebar.tsx

const handleClearFilters = () => {
  setMake('');
  setModel('');
  setBodyStyle('');  // Add this
  setCondition('');
  setMinPrice('');
  setMaxPrice('');

  router.push('/search');
};

// Update active filter count
const activeFilterCount =
  (make ? 1 : 0) +
  (model ? 1 : 0) +
  (bodyStyle ? 1 : 0) +  // Add this
  (condition ? 1 : 0) +
  (minPrice || maxPrice ? 1 : 0);
```

---

## Step 8: Add Filter Chip (Optional)

Show active body style filter as removable chip:

```typescript
// components/Search/FilterSidebar.tsx

{bodyStyle && (
  <div className="flex items-center gap-2 px-3 py-1 bg-brand/10 text-brand rounded-full text-sm">
    <span>Body Style: {bodyStyle}</span>
    <button
      onClick={() => setBodyStyle('')}
      className="hover:text-brand-hover"
    >
      <X className="h-3 w-3" />
    </button>
  </div>
)}
```

---

## Step 9: Write Tests

### Unit Test for Filter State

```typescript
// components/Search/__tests__/FilterSidebar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSidebar } from '../FilterSidebar';

describe('FilterSidebar - Body Style', () => {
  it('should render body style dropdown', () => {
    render(<FilterSidebar filterOptions={{ body_styles: ['Sedan', 'SUV'] }} />);

    expect(screen.getByLabelText('Body Style')).toBeInTheDocument();
  });

  it('should update URL when body style selected', () => {
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
      useSearchParams: () => new URLSearchParams(),
    }));

    render(<FilterSidebar filterOptions={{ body_styles: ['Sedan'] }} />);

    const select = screen.getByLabelText('Body Style');
    fireEvent.change(select, { target: { value: 'Sedan' } });

    expect(mockPush).toHaveBeenCalledWith('/search?bodyStyle=Sedan');
  });
});
```

### Integration Test

```bash
# Manual test checklist
# [ ] Dropdown populates with body styles
# [ ] Selecting body style updates URL
# [ ] Results filter correctly
# [ ] Clear filters button works
# [ ] Body style persists on page refresh
# [ ] Works with other filters
```

---

## Step 10: Commit Your Changes

```bash
# Create feature branch
git checkout -b feature/add-body-style-filter

# Stage changes
git add components/Search/FilterSidebar.tsx
git add app/api/search-vehicles/route.ts

# Commit
git commit -m "feat: add body style filter to search page

- Add body style dropdown to FilterSidebar
- Update search API to accept bodyStyle parameter
- Preserve bodyStyle in URL search params
- Add body style to clear filters handler
- Update active filter count
- Add tests for body style filtering"

# Push
git push -u origin feature/add-body-style-filter
```

---

## Step 11: Create Pull Request

1. Go to GitHub repository
2. Create Pull Request
3. Add description:

```markdown
## Summary
Adds body style filter to search page

## Changes
- Added body style dropdown to FilterSidebar
- Updated /api/search-vehicles to accept bodyStyle param
- Body style preserved in URL for sharing/bookmarking
- Integrated with existing clear filters functionality

## Testing
- [x] Dropdown populates correctly
- [x] Filtering works (Sedan, SUV, Truck, etc.)
- [x] URL updates correctly
- [x] Works with other filters (make, model, price)
- [x] Clear filters removes body style
- [x] Unit tests pass

## Screenshots
[Add screenshot of filter in action]
```

---

## What You Learned

✅ Added new filter UI component
✅ Updated API endpoint to handle new parameter
✅ Preserved filter state in URL
✅ Integrated with existing filters
✅ Wrote tests for new functionality
✅ Followed git workflow (branch → commit → PR)

---

## Bonus: Add Year Range Filter

Challenge yourself by adding a year range filter following the same pattern:

1. Add min/max year inputs to FilterSidebar
2. Update API to accept year parameters
3. Add to URL params
4. Test functionality

**Hint:** Follow the price range pattern already in the code.

---

## Next Steps

- Try [Understanding Flows](./understanding-flows.md) tutorial
- Read [Component Library](../reference/components/overview.md)
- Explore [Add UI Component](../how-to/add-ui-component.md) guide

---

**Congratulations!** 🎉 You've added a complete filter feature from UI to database.
