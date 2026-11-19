# Dr. Percentile

Dr. Percentile teaches math to learners ages 11–13. The classroom runs on TanStack Start, React, Vite, and Nitro. It uses the supplied Lovable mascot, curriculum, and problem generators.

## Local development

Use Node.js 22 (22.12 or later) and Bun. Install from the checked-in lockfile.

```sh
bun install --frozen-lockfile
bun run dev
bun run test
bunx tsc --noEmit
bun run build
```

The homepage, lesson library, diagnostic, guest dashboard, and guided practice run without credentials. Guest attempts are stored in browser storage. Use a separate browser profile for each guest on a shared device. Dates and daily goals use UTC.

## Supabase classroom setup

1. Use a fresh Supabase project for Vercel. Use a separate test project for Preview. In the SQL editor, run [deploy/classroom.sql](deploy/classroom.sql) once on each fresh project. It installs classroom profiles, links, events, row-level policies, and the AI quota function in a transaction. The historical Lovable schema is retained in `drizzle/`. It is independent of the Vercel classroom schema.
2. Disable public sign-ups in Supabase Auth and create approved users through the administrator interface. Use verified guardian contact and your approved consent workflow before creating an account for a child. Use a pseudonymous student nickname. Configure your Auth site URL and any password-recovery redirect URLs for the correct environment.
3. Insert one profile per approved Auth user. Link guardians explicitly after verifying the relationship. Replace example UUID tokens before running these statements:

   ```sql
   insert into public.classroom_members (id, role, nickname)
   values ('<guardian-auth-uuid>', 'guardian', 'Guardian'),
          ('<student-auth-uuid>', 'student', 'Math explorer');

   insert into public.classroom_links (guardian_id, student_id)
   values ('<guardian-auth-uuid>', '<student-auth-uuid>');
   ```

4. Sign in as the student and complete a lesson. Sign in as the linked guardian and check the new result. Use an unlinked guardian and an unrelated student to verify they cannot read the student's records. Check the same denials through the Data API using their own JWTs. Revoking a guardian link removes database access. Student scores are practice feedback and depend on client-side assessment.
5. For an existing Lovable database, review schema and data ownership before planning a separately approved migration. This application does not automatically copy or delete any existing data.

## Vercel

Import [the GitHub repository](https://github.com/maverickcalamari/dr-percentile) into the intended Vercel team. Use the repository root, Node.js 22, and the TanStack Start framework preset. The checked-in Vercel configuration uses frozen Bun installs and `bun run build`. Nitro emits the server and static assets in `.vercel/output`.

Set Preview and Production values individually in Vercel Project Settings. Keep a preview branch or PR for automatic preview builds. After verifying the preview, release through the configured production branch.

| Variable                        | Scope         | Purpose                                                         |
| ------------------------------- | ------------- | --------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Browser       | Supabase project URL for classroom accounts                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser       | Publishable key for the same project                            |
| `SUPABASE_URL`                  | Server        | Supabase project URL for the tutor API                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server secret | Supabase service key for the tutor quota operation              |
| `LOVABLE_API_KEY`               | Server secret | Lovable AI Gateway credential with the configured model enabled |
| `TUTOR_ENABLED`                 | Server        | Leave unset or false until live checks pass                     |

For tutoring, provision an approved test student with `ai_allowed = true` and a valid gateway key in Preview. Exercise progressive hints, follow-ups, off-topic and personal-info rejection, signed-out/guardian denials, and the allowance of 20 requests per UTC day. Review the provider's data processing and retention configuration for classroom use. The app leaves chat history in memory and blocks obvious contact details. Pattern checks cannot detect every form of personal information. Keep AI access disabled for students without approval. No credentials belong in GitHub.

Use a Vercel preview as the release checkpoint. Verify the homepage, both exercise types, diagnostic, guest persistence, account isolation, tutor API, and desktop/mobile interactions before publishing the full classroom.

## Homework review

Open Homework to add a PDF or worksheet photo and save review notes in this browser. Files remain on the current site and browser profile. Use the fraction division walkthrough to enter a problem from a worksheet, reveal each step, and check the exact quotient or number of complete groups.
