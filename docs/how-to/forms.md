# How-To: Build Forms with Best Practices

**Status:** 📋 Coming in Phase 3

This document will cover form handling best practices for Carzo.

## Planned Content

- Form validation with Zod
- Error state handling
- Accessible form patterns
- Input component usage
- Form submission handling
- Client-side vs server-side validation
- Form state management
- Loading states

## For Now

See these related documents:
- [Input Component](../reference/components/input.md) - Input props and error states
- [Add UI Component](./add-ui-component.md) - Component patterns
- [Add API Endpoint](./add-api-endpoint.md) - Server-side validation with Zod

## Quick Example

```typescript
import { Input } from '@/components/ui';
import { z } from 'zod';

const FormSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    // Validate with Zod
    const result = FormSchema.safeParse({
      email: formData.get('email'),
      name: formData.get('name'),
    });

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    // Submit to API...
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email"
        error={errors.email?.[0]}
      />
      <Input
        name="name"
        label="Name"
        error={errors.name?.[0]}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

**Last Updated**: 2025-11-13
