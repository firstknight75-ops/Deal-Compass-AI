-- Date: 2026-06-23
-- Author: AI Engineering Assistant
-- Description: Seed Arabic-first trade categories for marketplace discovery
-- Rollback: Delete rows by slug listed in this migration after confirming no dependent opportunities exist.

INSERT INTO public.trade_categories (slug, name_ar, name_en, name_tr, name_fa, name_ku, description_ar, icon, sort_order)
VALUES
  ('agriculture-food', 'الزراعة والأغذية', 'Agriculture & Food', 'Tarım ve Gıda', 'کشاورزی و غذا', 'کشتوکاڵ و خواردن', 'منتجات زراعية، مواد غذائية، محاصيل، ومستلزمات الإنتاج الغذائي.', 'wheat', 10),
  ('construction-materials', 'مواد البناء والإنشاءات', 'Construction Materials', 'İnşaat Malzemeleri', 'مصالح ساختمانی', 'کەرەستەی بیناسازی', 'إسمنت، حديد، حجر، سيراميك، ومواد مشاريع البناء.', 'building', 20),
  ('machinery-equipment', 'المكائن والمعدات', 'Machinery & Equipment', 'Makine ve Ekipman', 'ماشین‌آلات و تجهیزات', 'ئامێر و کەرەستە', 'معدات صناعية، مكائن إنتاج، خطوط تعبئة، وقطع غيار.', 'cog', 30),
  ('chemicals-plastics', 'الكيماويات والبلاستك', 'Chemicals & Plastics', 'Kimyasallar ve Plastik', 'مواد شیمیایی و پلاستیک', 'کیمیاوی و پلاستیک', 'مواد خام، كيماويات صناعية، بوليمرات، ومواد تغليف.', 'flask', 40),
  ('textiles-apparel', 'المنسوجات والملابس', 'Textiles & Apparel', 'Tekstil ve Giyim', 'نساجی و پوشاک', 'چنین و جلوبەرگ', 'أقمشة، ملابس جاهزة، أحذية، وإكسسوارات.', 'shirt', 50),
  ('medical-healthcare', 'الطب والرعاية الصحية', 'Medical & Healthcare', 'Medikal ve Sağlık', 'پزشکی و سلامت', 'پزیشکی و تەندروستی', 'مستلزمات طبية، أجهزة، أدوية، وخدمات صحية.', 'heart-pulse', 60),
  ('electronics-electrical', 'الإلكترونيات والكهربائيات', 'Electronics & Electrical', 'Elektronik ve Elektrik', 'الکترونیک و برق', 'ئەلیکترۆنی و کارەبا', 'أجهزة إلكترونية، مكونات كهربائية، وحلول طاقة.', 'zap', 70),
  ('logistics-transport', 'اللوجستيات والنقل', 'Logistics & Transport', 'Lojistik ve Taşımacılık', 'لجستیک و حمل‌ونقل', 'لۆجستیک و گواستنەوە', 'شحن، تخليص، نقل بري وبحري وجوي، وخدمات مخازن.', 'truck', 80),
  ('energy-fuel', 'الطاقة والوقود', 'Energy & Fuel', 'Enerji ve Yakıt', 'انرژی و سوخت', 'وزە و سووتەمەنی', 'منتجات الطاقة، وقود، مولدات، ومستلزمات تشغيل.', 'fuel', 90),
  ('business-services', 'خدمات الأعمال', 'Business Services', 'İş Hizmetleri', 'خدمات کسب‌وکار', 'خزمەتگوزاری بازرگانی', 'خدمات تجارية، استشارات، توريد، امتثال، وتمثيل.', 'briefcase', 100)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  name_tr = EXCLUDED.name_tr,
  name_fa = EXCLUDED.name_fa,
  name_ku = EXCLUDED.name_ku,
  description_ar = EXCLUDED.description_ar,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = NOW();
