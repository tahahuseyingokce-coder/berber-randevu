-- ============================================================
-- Faz 2: customer_notes insert politikası select ile tutarlı hale
-- getirildi. Önceki hali sadece shop_id kontrol ediyordu — bir
-- employee hiç randevusu olmadığı bir müşteriye de not ekleyebiliyordu.
-- ============================================================
drop policy "staff can insert customer notes" on customer_notes;

create policy "owner can insert any customer note"
  on customer_notes for insert
  with check (shop_id = current_staff_shop_id() and current_staff_is_owner());

create policy "employee can insert notes for own customers"
  on customer_notes for insert
  with check (
    shop_id = current_staff_shop_id()
    and exists (
      select 1 from appointments a
      where a.customer_id = customer_notes.customer_id
        and a.staff_id = current_staff_id()
    )
  );
