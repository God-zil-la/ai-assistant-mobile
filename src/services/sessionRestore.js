// Network failures leave the stored session intact; only a rejected token clears it.
export async function restoreSession({ getToken, getUser, clear }) {
  const token = await getToken();
  if (!token) return null;
  try {
    return await getUser(token);
  } catch (error) {
    if (error.status !== 401) throw error;
    await clear();
    return null;
  }
}
