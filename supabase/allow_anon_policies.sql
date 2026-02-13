-- ============================================
-- POLICIES RLS POUR ACCÈS ANONYME (DÉVELOPPEMENT)
-- ============================================
-- ATTENTION: Ces policies permettent l'accès anonyme pour le développement.
-- En production, il faudra utiliser l'authentification appropriée.
-- ============================================

-- Policies pour les tables principales (accès en lecture anonyme)

-- Sellers: lecture anonyme
DROP POLICY IF EXISTS "anon_read_sellers" ON public.sellers;
CREATE POLICY "anon_read_sellers" ON public.sellers
  FOR SELECT USING (true);

-- Clients: lecture anonyme
DROP POLICY IF EXISTS "anon_read_clients" ON public.clients;
CREATE POLICY "anon_read_clients" ON public.clients
  FOR SELECT USING (true);

-- Alerts: lecture et mise à jour anonyme
DROP POLICY IF EXISTS "anon_read_alerts" ON public.alerts;
DROP POLICY IF EXISTS "anon_update_alerts" ON public.alerts;
CREATE POLICY "anon_read_alerts" ON public.alerts
  FOR SELECT USING (true);

CREATE POLICY "anon_update_alerts" ON public.alerts
  FOR UPDATE USING (true);

-- Client assignments: lecture anonyme
DROP POLICY IF EXISTS "anon_read_assignments" ON public.client_assignments;
CREATE POLICY "anon_read_assignments" ON public.client_assignments
  FOR SELECT USING (true);

-- Seller metrics: lecture anonyme
DROP POLICY IF EXISTS "anon_read_metrics" ON public.seller_metrics_daily;
CREATE POLICY "anon_read_metrics" ON public.seller_metrics_daily
  FOR SELECT USING (true);

-- House metrics: lecture anonyme
DROP POLICY IF EXISTS "anon_read_house_metrics" ON public.house_metrics_daily;
CREATE POLICY "anon_read_house_metrics" ON public.house_metrics_daily
  FOR SELECT USING (true);

-- Reassignment events: lecture et insertion anonyme
DROP POLICY IF EXISTS "anon_read_reassignments" ON public.reassignment_events;
DROP POLICY IF EXISTS "anon_insert_reassignments" ON public.reassignment_events;
CREATE POLICY "anon_read_reassignments" ON public.reassignment_events
  FOR SELECT USING (true);

CREATE POLICY "anon_insert_reassignments" ON public.reassignment_events
  FOR INSERT WITH CHECK (true);

-- Houses: lecture anonyme
DROP POLICY IF EXISTS "anon_read_houses" ON public.houses;
CREATE POLICY "anon_read_houses" ON public.houses
  FOR SELECT USING (true);

-- Interactions: lecture anonyme
DROP POLICY IF EXISTS "anon_read_interactions" ON public.interactions;
CREATE POLICY "anon_read_interactions" ON public.interactions
  FOR SELECT USING (true);

-- Client attributes: lecture anonyme
DROP POLICY IF EXISTS "anon_read_client_attributes" ON public.client_attributes;
CREATE POLICY "anon_read_client_attributes" ON public.client_attributes
  FOR SELECT USING (true);

-- Notifications: lecture anonyme
DROP POLICY IF EXISTS "anon_read_notifications" ON public.notifications;
CREATE POLICY "anon_read_notifications" ON public.notifications
  FOR SELECT USING (true);

-- Recommendations: lecture anonyme
DROP POLICY IF EXISTS "anon_read_recommendations" ON public.recommendations;
CREATE POLICY "anon_read_recommendations" ON public.recommendations
  FOR SELECT USING (true);

SELECT 'Policies RLS anonymes créées avec succès!' as message;
SELECT 'ATTENTION: Ces policies sont pour le développement uniquement!' as warning;
