export default async function RandevuIptalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <div>Randevu İptal — {token}</div>;
}
