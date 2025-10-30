export function formatZodError(zodError) {
  if (!zodError) return { errors: [] };

  // Zod v3 uses `issues` array; some code used `errors` alias
  const issues = zodError.issues || zodError.errors || [];

  const errors = issues.map((it) => {
    return {
      message: it.message || String(it),
      path: it.path || it.path || [],
    };
  });

  return { errors };
}
