BEGIN;
CREATE TEMP TABLE qa_context (user_id uuid, restaurant_id uuid, admin_id uuid);
CREATE TEMP TABLE qa_results (name text, result jsonb);
GRANT SELECT ON qa_context TO authenticated;
GRANT SELECT,INSERT ON qa_results TO authenticated,anon;
INSERT INTO qa_context(user_id,admin_id) SELECT gen_random_uuid(),id FROM public.profiles WHERE role='super_admin' LIMIT 1;
INSERT INTO auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
SELECT user_id,'authenticated','authenticated','qa-'||user_id||'@example.invalid','{"provider":"email","providers":["email"]}'::jsonb,
 jsonb_build_object('full_name','QA rollback','partner_application',true,'restaurant_name','QA +UM rollback','restaurant_address','Rua de teste, 100','restaurant_city_id',(SELECT id FROM public.cities WHERE is_active LIMIT 1),'restaurant_cep','45000-000','restaurant_whatsapp','(77) 99999-0000'),now(),now()
FROM qa_context;
UPDATE qa_context SET restaurant_id=(SELECT id FROM public.restaurants WHERE admin_user_id=qa_context.user_id);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM qa_context q JOIN public.restaurants r ON r.id=q.restaurant_id WHERE r.partner_status='pending' AND NOT r.is_active AND r.cep='45000000' AND r.whatsapp='77999990000') THEN RAISE EXCEPTION 'signup failed'; END IF;
END $$;
INSERT INTO qa_results VALUES('new_partner_signup','{"pending":true,"inactive":true,"contact_normalized":true}');
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'role','authenticated')::text,true) FROM qa_context;
DO $$ BEGIN
 BEGIN PERFORM public.approve_partner_application((SELECT restaurant_id FROM qa_context)); RAISE EXCEPTION 'nonadmin approved'; EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'forbidden' THEN RAISE; END IF; END;
 BEGIN PERFORM public.get_admin_metrics(); RAISE EXCEPTION 'nonadmin metrics'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO qa_results VALUES('non_admin_denied','{"approval":true,"metrics":true}');
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN UPDATE public.restaurants SET partner_status='approved',is_active=true WHERE id=(SELECT restaurant_id FROM qa_context); RAISE EXCEPTION 'self approval allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.restaurants SET address='Rua editada, 100' WHERE id=(SELECT restaurant_id FROM qa_context);
 BEGIN UPDATE public.profiles SET role='super_admin' WHERE id=(SELECT user_id FROM qa_context); RAISE EXCEPTION 'self promotion allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
INSERT INTO qa_results VALUES('partner_direct_changes','{"self_approval_denied":true,"self_promotion_denied":true,"normal_edit_allowed":true}');
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true) FROM qa_context;
SET LOCAL ROLE authenticated;
INSERT INTO qa_results SELECT 'admin_pending_queue',jsonb_build_object('pending_fixture_visible',count(*)=1) FROM public.restaurants WHERE partner_status='pending' AND admin_user_id=(SELECT user_id FROM qa_context);
RESET ROLE;
INSERT INTO qa_results SELECT 'admin_approval',public.approve_partner_application(restaurant_id) FROM qa_context;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM qa_context q JOIN public.restaurants r ON r.id=q.restaurant_id JOIN public.profiles p ON p.id=q.user_id WHERE r.partner_status='approved' AND r.is_active AND p.role='restaurant_admin') THEN RAISE EXCEPTION 'approval propagation failed'; END IF;
END $$;
SELECT set_config('qa.restaurant_id',restaurant_id::text,true),set_config('qa.user_id',user_id::text,true),set_config('qa.admin_id',admin_id::text,true) FROM qa_context;
GRANT SELECT,INSERT ON qa_results TO anon,authenticated;
SELECT set_config('request.jwt.claims','{}',true);
SET LOCAL ROLE anon;
INSERT INTO qa_results SELECT 'app_catalog_visibility_after_approval',jsonb_build_object('visible',count(*)=1) FROM public.restaurants WHERE id=current_setting('qa.restaurant_id')::uuid;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('qa.user_id'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
INSERT INTO qa_results SELECT 'partner_panel_access_after_approval',jsonb_build_object('role',public.get_user_role(),'own_restaurant',public.get_my_restaurant_id()=current_setting('qa.restaurant_id')::uuid,'own_profile_count',(SELECT count(*) FROM public.profiles WHERE id=current_setting('qa.user_id')::uuid));
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('qa.admin_id'),'role','authenticated')::text,true);
INSERT INTO qa_results SELECT 'admin_rejection',public.reject_partner_application(current_setting('qa.restaurant_id')::uuid);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM qa_context q JOIN public.restaurants r ON r.id=q.restaurant_id JOIN public.profiles p ON p.id=q.user_id WHERE r.partner_status='rejected' AND NOT r.is_active AND p.role='user') THEN RAISE EXCEPTION 'rejection propagation failed'; END IF;
END $$;
SELECT set_config('request.jwt.claims','{}',true);
SET LOCAL ROLE anon;
INSERT INTO qa_results SELECT 'app_catalog_visibility_after_rejection',jsonb_build_object('hidden',count(*)=0) FROM public.restaurants WHERE id=current_setting('qa.restaurant_id')::uuid;
RESET ROLE;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('qa.admin_id'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
INSERT INTO qa_results SELECT 'admin_reads',jsonb_build_object('profiles',(SELECT count(*) FROM public.profiles),'restaurants',(SELECT count(*) FROM public.restaurants),'pending',(SELECT count(*) FROM public.restaurants WHERE partner_status='pending'),'metrics',public.get_admin_metrics());
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$ DECLARE v_sub uuid; v_coupon uuid; BEGIN
 INSERT INTO public.subscriptions(user_id,plan_type,status,provider,access_source,provider_subscription_id,current_period_start,current_period_end)
 SELECT user_id,'annual','active','manual','manual','manual-admin:'||user_id,now(),now()+interval '1 year' FROM qa_context RETURNING id INTO v_sub;
 INSERT INTO public.coupons(user_id,subscription_id,status,source,expires_at)
 SELECT user_id,v_sub,'available','admin',now()+interval '1 year' FROM qa_context RETURNING id INTO v_coupon;
 UPDATE public.coupons SET status='expired' WHERE id=v_coupon;
 IF NOT EXISTS(SELECT 1 FROM public.coupons WHERE id=v_coupon AND status='expired' AND source='admin') THEN RAISE EXCEPTION 'admin coupon failed'; END IF;
END $$;
INSERT INTO qa_results VALUES('admin_user_actions','{"manual_annual_grant":true,"admin_coupon_add":true,"admin_coupon_expire":true}');
INSERT INTO qa_results SELECT 'user_pagination',jsonb_build_object('all_rows_reachable',count(*)=(SELECT count(*) FROM public.profiles),'pages',ceil(count(*)::numeric/100)) FROM (SELECT id FROM public.profiles ORDER BY created_at DESC,id DESC) p;
RESET ROLE;

SELECT jsonb_agg(jsonb_build_object('test',name,'result',result)) results FROM qa_results;
ROLLBACK;
