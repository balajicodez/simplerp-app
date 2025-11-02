export async function fetchOrganizations() {
  const res = await fetch('/api/organizations');
  if (!res.ok) throw new Error('Failed to fetch organizations');
  const data = await res.json();
  return data._embedded ? data._embedded.organizations || [] : data;
}
