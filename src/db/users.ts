import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null,
  photoUrl?: string | null
) {
  const [user] = await db
    .insert(users)
    .values({
      uid,
      email,
      displayName: displayName || null,
      photoUrl: photoUrl || null,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
      },
    })
    .returning();

  if (!user) throw new Error('User profile could not be saved.');
  return user;
}
