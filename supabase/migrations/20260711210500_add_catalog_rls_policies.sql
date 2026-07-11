-- Catalog tables had RLS enabled but zero policies (deny-all). Public browsing
-- for marketplace-facing tables, org-scoped management for creators' own
-- items, commission terms visible only to the owning org.

CREATE POLICY "Anyone can view catalog types" ON public.catalog_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view catalog categories" ON public.catalog_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view catalog audiences" ON public.catalog_audiences FOR SELECT USING (true);
CREATE POLICY "Anyone can view commission tiers" ON public.commission_tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can view commission plans" ON public.commission_plans FOR SELECT USING (true);

CREATE POLICY "Public can view active marketplace items" ON public.catalog_items
  FOR SELECT USING (active = true AND listed_on_main_marketplace = true);
CREATE POLICY "Org members can view their own catalog items" ON public.catalog_items
  FOR SELECT USING (organization_id IS NOT NULL AND is_org_member(organization_id));
CREATE POLICY "Org members can manage their own catalog items" ON public.catalog_items
  FOR ALL USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));

CREATE POLICY "Visible if the parent catalog item is visible" ON public.catalog_pricing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.catalog_items ci
      WHERE ci.id = catalog_pricing.catalog_item_id
      AND (
        (ci.active AND ci.listed_on_main_marketplace)
        OR (ci.organization_id IS NOT NULL AND is_org_member(ci.organization_id))
      )
    )
  );
CREATE POLICY "Org members manage pricing on their own items" ON public.catalog_pricing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.catalog_items ci WHERE ci.id = catalog_pricing.catalog_item_id AND is_org_member(ci.organization_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.catalog_items ci WHERE ci.id = catalog_pricing.catalog_item_id AND is_org_member(ci.organization_id))
  );

CREATE POLICY "Visible if the parent catalog item is visible" ON public.catalog_item_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.catalog_items ci
      WHERE ci.id = catalog_item_links.catalog_item_id
      AND (
        (ci.active AND ci.listed_on_main_marketplace)
        OR (ci.organization_id IS NOT NULL AND is_org_member(ci.organization_id))
      )
    )
  );
CREATE POLICY "Org members manage links on their own items" ON public.catalog_item_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.catalog_items ci WHERE ci.id = catalog_item_links.catalog_item_id AND is_org_member(ci.organization_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.catalog_items ci WHERE ci.id = catalog_item_links.catalog_item_id AND is_org_member(ci.organization_id))
  );

CREATE POLICY "Org members can view commission terms on their own items" ON public.catalog_commissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.catalog_items ci WHERE ci.id = catalog_commissions.catalog_item_id AND is_org_member(ci.organization_id))
  );
