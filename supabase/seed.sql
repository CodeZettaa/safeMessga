-- Default categories, moderation terms, and a safe Arabic demo Q&A set.
-- Run after 0001_init.sql. Does not create an admin user.

insert into public.categories (key, name_ar, name_en, icon, color, sort_order, is_active)
values
  ('technical', 'سؤال تقني', 'Technical question', 'code', '#5B3A8C', 10, true),
  ('career', 'نصيحة مهنية', 'Career advice', 'briefcase', '#7A4E9C', 20, true),
  ('courses', 'سؤال عن الكورسات', 'Course question', 'graduation-cap', '#C45C6A', 30, true),
  ('content', 'اقتراح محتوى', 'Content suggestion', 'sparkles', '#D97862', 40, true),
  ('feedback', 'Feedback', 'Feedback', 'message-circle-heart', '#E07A6A', 50, true),
  ('general', 'رسالة عامة', 'General message', 'heart', '#B56B8A', 60, true)
on conflict (key) do update
set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Custom blocked terms the admin can later edit. Bundled server rules still apply.
insert into public.blocked_terms (normalized_term, language, category, severity, is_active)
select t.normalized_term, t.language::public.blocked_term_language, t.category::public.blocked_term_category, t.severity, t.is_active
from (values
  ('كسم', 'ar', 'insult_ar', 5, true),
  ('كس ام', 'ar', 'insult_ar', 5, true),
  ('شرموط', 'ar', 'insult_ar', 5, true),
  ('عرص', 'ar', 'insult_ar', 5, true),
  ('خول', 'ar', 'insult_ar', 4, true),
  ('قحبة', 'ar', 'insult_ar', 5, true),
  ('متناك', 'ar', 'insult_ar', 5, true),
  ('يلعن', 'ar', 'personal_attack', 3, true),
  ('fuck', 'en', 'insult_en', 4, true),
  ('shit', 'en', 'insult_en', 3, true),
  ('bitch', 'en', 'insult_en', 4, true),
  ('asshole', 'en', 'insult_en', 4, true),
  ('slut', 'en', 'insult_en', 5, true),
  ('whore', 'en', 'insult_en', 5, true),
  ('cunt', 'en', 'insult_en', 5, true),
  ('kosom', 'arabizi', 'insult_arabizi', 5, true),
  ('ksmk', 'arabizi', 'insult_arabizi', 5, true),
  ('sharmota', 'arabizi', 'insult_arabizi', 5, true),
  ('3ars', 'arabizi', 'insult_arabizi', 5, true),
  ('khawal', 'arabizi', 'insult_arabizi', 4, true),
  ('ابعتي صور', 'ar', 'sexual_harassment', 5, true),
  ('send nudes', 'en', 'sexual_harassment', 5, true),
  ('هقتلك', 'ar', 'threat', 5, true),
  ('i will kill', 'en', 'threat', 5, true),
  ('واتساب', 'ar', 'contact_solicitation', 3, true),
  ('whatsapp', 'en', 'contact_solicitation', 3, true)
) as t(normalized_term, language, category, severity, is_active)
where not exists (
  select 1 from public.blocked_terms existing
  where existing.normalized_term = t.normalized_term and existing.is_active = true
);

-- Demo published Q&A. Safe technical/career content only.
do $$
declare
  cat_technical uuid;
  cat_career uuid;
  cat_courses uuid;
  cat_content uuid;
  sub1 uuid;
  sub2 uuid;
  sub3 uuid;
  sub4 uuid;
  sub5 uuid;
begin
  if exists (select 1 from public.submissions where reference_code = 'AN-DEMO01') then
    return;
  end if;

  select id into cat_technical from public.categories where key = 'technical';
  select id into cat_career from public.categories where key = 'career';
  select id into cat_courses from public.categories where key = 'courses';
  select id into cat_content from public.categories where key = 'content';

  insert into public.submissions (
    id, reference_code, category_id, original_title, original_message,
    identity_mode, sender_display_name, allow_public_name, allow_publication,
    sender_hash, message_fingerprint, status, moderation_decision,
    moderation_risk_score, moderation_reason_code, moderation_provider
  ) values
  (
    gen_random_uuid(), 'AN-DEMO01', cat_technical,
    'أبدأ فرونت إند منين؟',
    'أنا لسة مبتدئة وحابة أتعلم فرونت إند بشكل مرتب. أبدأ بـ HTML و CSS ولا أدخل على فريمورك بدري؟',
    'anonymous', null, false, true,
    'demo-hash-1', 'demo-fp-1', 'answered', 'accepted', 0.050, 'safe', 'local'
  )
  returning id into sub1;

  insert into public.answers (
    submission_id, answer_body, public_question_title, public_question_body,
    public_display_name, slug, is_published, is_pinned, is_draft, view_count, published_at
  ) values (
    sub1,
    'ابدئي بالأساسيات: HTML، CSS، وبعدين JavaScript. الفريمورك بيجي بعد ما تفهمي الويب نفسه. خدي مشروع صغير كل أسبوع، ولو حاجات وقفت معاكي ابعتي تاني.',
    'أبدأ فرونت إند منين؟',
    'أنا لسة مبتدئة وحابة أتعلم فرونت إند بشكل مرتب. أبدأ بـ HTML و CSS ولا أدخل على فريمورك بدري؟',
    'مجهول',
    'abda-frontend-mneen',
    true, true, false, 128, now() - interval '12 days'
  );

  insert into public.submissions (
    id, reference_code, category_id, original_title, original_message,
    identity_mode, sender_display_name, allow_public_name, allow_publication,
    sender_hash, message_fingerprint, status, moderation_decision,
    moderation_risk_score, moderation_reason_code, moderation_provider
  ) values
  (
    gen_random_uuid(), 'AN-DEMO02', cat_career,
    'إزاي أجهز لبورتفوليو أول شغل؟',
    'خلصت كورسات كتير ومش عارفة أختار مشاريع للبورتفوليو. هل لازم أعمل مشاريع معقدة ولا مشاريع بسيطة ومتقنة أفضل؟',
    'identified', 'سارة', true, true,
    'demo-hash-2', 'demo-fp-2', 'answered', 'accepted', 0.040, 'safe', 'local'
  )
  returning id into sub2;

  insert into public.answers (
    submission_id, answer_body, public_question_title, public_question_body,
    public_display_name, slug, is_published, is_pinned, is_draft, view_count, published_at
  ) values (
    sub2,
    'ثلاث مشاريع متقنة أحسن من عشر مشاريع ناقصة. اختاري مشروع شخصي، مشروع فيه API، ومشروع يحل مشكلة حقيقية. وضحي قرارتك في README، واتكلمي عن اللي اتعلمته مش عن الأدوات بس.',
    'إزاي أجهز لبورتفوليو أول شغل؟',
    'خلصت كورسات كتير ومش عارفة أختار مشاريع للبورتفوليو. هل لازم أعمل مشاريع معقدة ولا مشاريع بسيطة ومتقنة أفضل؟',
    'سارة',
    'portfolio-awel-shoghl',
    true, false, false, 86, now() - interval '8 days'
  );

  insert into public.submissions (
    id, reference_code, category_id, original_title, original_message,
    identity_mode, sender_display_name, allow_public_name, allow_publication,
    sender_hash, message_fingerprint, status, moderation_decision,
    moderation_risk_score, moderation_reason_code, moderation_provider
  ) values
  (
    gen_random_uuid(), 'AN-DEMO03', cat_courses,
    'هل أحتاج ماث قوي قبل الـ backend؟',
    'عايزة أدخل باك إند وقلقانة من الرياضيات. هل لازم أكون قوية في الماث قبل ما أتعلم Node أو قواعد البيانات؟',
    'anonymous', null, false, true,
    'demo-hash-3', 'demo-fp-3', 'answered', 'accepted', 0.030, 'safe', 'local'
  )
  returning id into sub3;

  insert into public.answers (
    submission_id, answer_body, public_question_title, public_question_body,
    public_display_name, slug, is_published, is_pinned, is_draft, view_count, published_at
  ) values (
    sub3,
    'للشغل اليومي في الويب مش محتاجة ماث متقدم. اللي يفيدك أكتر هو المنطق، التعامل مع البيانات، وفهم HTTP. لو بعد كده حبتي تخصصات زي الجرافيكس أو الـ ML ساعتها تزودي الماث.',
    'هل أحتاج ماث قوي قبل الـ backend؟',
    'عايزة أدخل باك إند وقلقانة من الرياضيات. هل لازم أكون قوية في الماث قبل ما أتعلم Node أو قواعد البيانات؟',
    'مجهول',
    'math-abl-el-backend',
    true, false, false, 64, now() - interval '5 days'
  );

  insert into public.submissions (
    id, reference_code, category_id, original_title, original_message,
    identity_mode, sender_display_name, allow_public_name, allow_publication,
    sender_hash, message_fingerprint, status, moderation_decision,
    moderation_risk_score, moderation_reason_code, moderation_provider
  ) values
  (
    gen_random_uuid(), 'AN-DEMO04', cat_content,
    'اقترحوا فيديو عن Git',
    'حابة فيديو عملي عن Git من الصفر: commit، branch، وحل التعارضات، من غير ما نغوص في أوامر نادرة.',
    'identified', 'منى', false, true,
    'demo-hash-4', 'demo-fp-4', 'answered', 'accepted', 0.020, 'safe', 'local'
  )
  returning id into sub4;

  insert into public.answers (
    submission_id, answer_body, public_question_title, public_question_body,
    public_display_name, slug, is_published, is_pinned, is_draft, view_count, published_at
  ) values (
    sub4,
    'اقتراح ممتاز. المسار العملي اللي بفيده معظم الناس: إنشاء ريبو، أول commit، branch للعمل اليومي، وحل تعارض بسيط. الاسم مش هيظهر هنا لأن الرسالة اتنشرت كمجهول.',
    'اقترحوا فيديو عن Git',
    'حابة فيديو عملي عن Git من الصفر: commit، branch، وحل التعارضات، من غير ما نغوص في أوامر نادرة.',
    'مجهول',
    'git-video-suggestion',
    true, false, false, 41, now() - interval '2 days'
  );

  insert into public.submissions (
    id, reference_code, category_id, original_title, original_message,
    identity_mode, sender_display_name, allow_public_name, allow_publication,
    sender_hash, message_fingerprint, status, moderation_decision,
    moderation_risk_score, moderation_reason_code, moderation_provider
  ) values
  (
    gen_random_uuid(), 'AN-DEMO05', cat_career,
    'أتقدم على جونيور وأنا لسة بتعلم؟',
    'بخد كورس وماشية كويس، بس مش عارفة إذا كان بدري على التقديم ولا أستنى لحد ما أحس إني جاهزة مية في المية.',
    'anonymous', null, false, true,
    'demo-hash-5', 'demo-fp-5', 'answered', 'accepted', 0.020, 'safe', 'local'
  )
  returning id into sub5;

  insert into public.answers (
    submission_id, answer_body, public_question_title, public_question_body,
    public_display_name, slug, is_published, is_pinned, is_draft, view_count, published_at
  ) values (
    sub5,
    'متستنيش الإحساس المثالي بالجاهزية. قدمي لما تقدري تشرحي مشروعين بوضوح وتعمليهم من غير نسخ أعمى. المقابلات نفسها جزء من التعلم.',
    'أتقدم على جونيور وأنا لسة بتعلم؟',
    'بخد كورس وماشية كويس، بس مش عارفة إذا كان بدري على التقديم ولا أستنى لحد ما أحس إني جاهزة مية في المية.',
    'مجهول',
    'junior-applications-while-learning',
    true, false, false, 73, now() - interval '1 day'
  );
end $$;
