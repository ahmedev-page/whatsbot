import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_COLOR_SWATCHES,
  CONVERSATION_SERVICE_OPTIONS,
  CREATION_STEPS_ORDER,
  analyzeUserProjectRequest,
  buildCreateInPlatformPayload,
  canCreateServiceWithTemplate,
  computeServiceQuotaStatus,
  getConversationalServiceOption,
  getDynamicCreationSteps,
  getNextCreationStep,
  getPrevCreationStep,
  getStepLabelForTemplate,
  isInteractiveToolTemplate,
  isValidServiceTemplateId,
  isWebsiteTemplate,
  parseSmartChatInput,
  parseStudioEditCommand,
  resolveMultiServiceCommand,
  type AssistantServiceSummary,
} from '../conversational-creator';

test('CONVERSATION_SERVICE_OPTIONS covers all 9 platform service templates across 2 groups', () => {
  assert.equal(CONVERSATION_SERVICE_OPTIONS.length, 9);
  const websites = CONVERSATION_SERVICE_OPTIONS.filter((o) => o.groupId === 'websites');
  const tools = CONVERSATION_SERVICE_OPTIONS.filter((o) => o.groupId === 'tools');
  assert.equal(websites.length, 5);
  assert.equal(tools.length, 4);

  for (const option of CONVERSATION_SERVICE_OPTIONS) {
    assert.ok(option.visualCards.length >= 3, `${option.templateId} should have >= 3 visual preview cards`);
    assert.ok(option.userIntentPhrase.length > 0);
    assert.ok(option.botPraisePhrase.length > 0);
    assert.ok(option.nameQuestion.length > 0);
    assert.ok(option.desc.length > 0);
    assert.equal(isValidServiceTemplateId(option.templateId), true);
  }
  assert.equal(isValidServiceTemplateId(''), false);
  assert.equal(isValidServiceTemplateId('invalid_service'), false);
});

test('getConversationalServiceOption returns matching option or defaults to store', () => {
  const storeOpt = getConversationalServiceOption('store');
  assert.equal(storeOpt.templateId, 'store');
  assert.equal(storeOpt.defaultSampleName, 'دار آروما');

  const fallbackOpt = getConversationalServiceOption('unknown_id');
  assert.equal(fallbackOpt.templateId, 'store');
});

test('progressive creation steps order, dynamic project steps, and step navigation helpers', () => {
  assert.equal(CREATION_STEPS_ORDER.length, 6);
  assert.equal(CREATION_STEPS_ORDER[0], 'service_type');
  assert.equal(CREATION_STEPS_ORDER[5], 'preview_publish');
  assert.equal(getNextCreationStep('service_type'), 'project_name');
  assert.equal(getNextCreationStep('project_name'), 'template_style');
  assert.equal(getNextCreationStep('template_style'), 'brand_color');
  assert.equal(getNextCreationStep('brand_color'), 'content_items');
  assert.equal(getNextCreationStep('content_items'), 'preview_publish');
  assert.equal(getNextCreationStep('preview_publish'), 'preview_publish');
  assert.equal(getPrevCreationStep('project_name'), 'service_type');
  assert.equal(getPrevCreationStep('service_type'), 'service_type');

  // Dynamic step sequences adapt by template type and prompt context
  const storeStepsWithNameAndColor = getDynamicCreationSteps('store', {
    skipProjectName: true,
    skipBrandColor: true,
  });
  assert.deepEqual(storeStepsWithNameAndColor, [
    'service_type',
    'template_style',
    'content_items',
    'preview_publish',
  ]);

  const surveySteps = getDynamicCreationSteps('survey');
  assert.deepEqual(surveySteps, [
    'service_type',
    'project_name',
    'template_style',
    'content_items',
    'preview_publish',
  ]);
  assert.equal(getStepLabelForTemplate('content_items', 'survey'), 'أسئلة الاستبيان والتقييم');
  assert.equal(getStepLabelForTemplate('content_items', 'vcard'), 'الحسابات والروابط الرقمية');
  assert.equal(getStepLabelForTemplate('content_items', 'booking'), 'خدمات الحجز وأوقات الدوام');
});

test('analyzeUserProjectRequest extracts service type, project name, color, and next adaptive step', () => {
  const res1 = analyzeUserProjectRequest('أريد متجر عطور باسم دار العود باللون الذهبي');
  assert.equal(res1.templateId, 'store');
  assert.equal(res1.extractedSiteName, 'دار العود');
  assert.equal(res1.extractedColor, '#D97706');
  assert.equal(res1.skipProjectName, true);
  assert.equal(res1.skipBrandColor, true);
  assert.equal(res1.nextStep, 'template_style');

  const res2 = analyzeUserProjectRequest('منيو كافيه ومحمصة قهوة');
  assert.equal(res2.templateId, 'restaurant');
  assert.equal(res2.skipProjectName, false);
  assert.equal(res2.nextStep, 'project_name');

  const res3 = analyzeUserProjectRequest('نظام حجز مواعيد لعيادة سمايا التخصصية');
  assert.equal(res3.templateId, 'booking');
  assert.equal(res3.extractedSiteName, 'سمايا التخصصية');
  assert.equal(res3.nextStep, 'template_style');
});

test('parseSmartChatInput detects service switching, project name, phone, item addition, and launch', () => {
  const switchRes = parseSmartChatInput('أريد إنشاء مطعم', {
    templateId: 'store',
    siteName: '',
  });
  assert.equal(switchRes.action, 'select_template');
  assert.equal(switchRes.templateId, 'restaurant');

  const nameRes = parseSmartChatInput('دار آروما', {
    templateId: 'store',
    siteName: '',
  });
  assert.equal(nameRes.action, 'set_site_name');
  assert.equal(nameRes.siteName, 'دار آروما');

  const phoneRes = parseSmartChatInput('0551234567', {
    templateId: 'store',
    siteName: 'دار آروما',
  });
  assert.equal(phoneRes.action, 'set_contact_phone');
  assert.equal(phoneRes.phone, '966551234567');

  const itemRes = parseSmartChatInput('أضف: قهوة مختصة - 28 ر.س', {
    templateId: 'store',
    siteName: 'دار آروما',
  });
  assert.equal(itemRes.action, 'add_item');
  assert.equal(itemRes.item?.name, 'قهوة مختصة');
  assert.equal(itemRes.item?.price, '28 ر.س');

  const launchRes = parseSmartChatInput('اطلاق', {
    templateId: 'store',
    siteName: 'دار آروما',
  });
  assert.equal(launchRes.action, 'launch_request');
});

test('buildCreateInPlatformPayload preserves all existing fields and cleans arrays', () => {
  const payload = buildCreateInPlatformPayload({
    siteName: '  دار آروما  ',
    username: 'dar-aroma',
    templateId: 'portfolio',
    templateStyle: 'modern',
    themeColor: CHAT_COLOR_SWATCHES[0].hex,
    darkMode: true,
    tagline: 'قهوة مختصة فاخرة',
    headline: 'دار آروما للقهوة المختصة',
    description: 'نقدم أجود محاصيل القهوة المختصة.',
    ctaLabel: 'اطلب الآن',
    phone: '966500000000',
    whatsapp: '',
    email: 'hello@dararoma.sa',
    address: 'الرياض',
    instagram: '@dararoma',
    twitter: '',
    tiktok: '',
    snapchat: '',
    hours: [
      { day: 'السبت - الخميس', time: '8 ص - 11 م' },
      { day: '  ', time: '  ' },
    ],
    initialItems: [
      { name: 'محصول إثيوبي', price: '45 ر.س' },
      { name: '   ', price: '' },
    ],
    skillsText: 'تحميص القهوة، القهوة المختصة, الإسبريسو',
  });

  assert.equal(payload.siteName, 'دار آروما');
  assert.equal(payload.username, 'dar-aroma');
  assert.equal(payload.whatsapp, '966500000000');
  assert.equal(payload.hours?.length, 1);
  assert.equal(payload.initialItems?.length, 1);
  assert.deepEqual(payload.skills, ['تحميص القهوة', 'القهوة المختصة', 'الإسبريسو']);
});

test('computeServiceQuotaStatus supports up to 3 independent services (e.g. Store + Restaurant + Booking)', () => {
  assert.equal(isWebsiteTemplate('store'), true);
  assert.equal(isWebsiteTemplate('restaurant'), true);
  assert.equal(isWebsiteTemplate('survey'), false);
  assert.equal(isInteractiveToolTemplate('survey'), true);
  assert.equal(isInteractiveToolTemplate('booking'), true);

  const emptyQuota = computeServiceQuotaStatus([]);
  assert.equal(emptyQuota.websiteCount, 0);
  assert.equal(emptyQuota.toolCount, 0);
  assert.equal(emptyQuota.canCreateWebsite, true);
  assert.equal(emptyQuota.canCreateTool, true);
  assert.equal(canCreateServiceWithTemplate('', emptyQuota).allowed, false);

  const afterStoreAndRestaurant = computeServiceQuotaStatus([
    { templateId: 'store', username: 'dar-aroma', siteName: 'متجر دار آروما' },
    { templateId: 'restaurant', username: 'mathaq-rest', siteName: 'مطعم مذاق' },
  ]);
  assert.equal(afterStoreAndRestaurant.totalCount, 2);
  assert.equal(canCreateServiceWithTemplate('booking', afterStoreAndRestaurant).allowed, true);

  const fullQuota = computeServiceQuotaStatus([
    { templateId: 'store', username: 'dar-aroma', siteName: 'متجر دار آروما' },
    { templateId: 'restaurant', username: 'mathaq-rest', siteName: 'مطعم مذاق' },
    { templateId: 'booking', username: 'dental-book', siteName: 'حجز عيادة النور' },
  ]);
  assert.equal(fullQuota.totalCount, 3);
  assert.equal(fullQuota.canCreateAny, false);
  assert.equal(canCreateServiceWithTemplate('rsvp', fullQuota).allowed, false);
});

test('resolveMultiServiceCommand distinguishes between user services, asks on ambiguity, and executes directly when clear', () => {
  const threeServices: AssistantServiceSummary[] = [
    {
      username: 'dar-aroma',
      siteName: 'متجر دار آروما',
      templateId: 'store',
      visitsToday: 12,
      visitsTotal: 140,
      submissionsCount: 4,
    },
    {
      username: 'mathaq-rest',
      siteName: 'مطعم مذاق الشرق',
      templateId: 'restaurant',
      visitsToday: 25,
      visitsTotal: 310,
      submissionsCount: 9,
    },
    {
      username: 'noor-booking',
      siteName: 'حجوزات عيادة النور',
      templateId: 'booking',
      visitsToday: 8,
      visitsTotal: 95,
      submissionsCount: 6,
    },
  ];

  // 1. Ambiguous request («غيّر أوقات العمل») across 3 services -> Must ask which service first
  const ambiguousRes = resolveMultiServiceCommand('غيّر أوقات العمل', threeServices);
  assert.equal(ambiguousRes.status, 'needs_disambiguation');
  assert.ok(ambiguousRes.botReply.includes('لأي خدمة تريد تغيير أوقات العمل؟'));
  assert.equal(ambiguousRes.candidateServices.length, 3);
  assert.ok(ambiguousRes.pendingContext);

  // 2. User answers the disambiguation question by specifying the service («المطعم»)
  const disambiguatedFollowUp = resolveMultiServiceCommand(
    'المطعم',
    threeServices,
    ambiguousRes.pendingContext
  );
  assert.equal(disambiguatedFollowUp.status, 'resolved');
  assert.equal(disambiguatedFollowUp.targetService?.username, 'mathaq-rest');
  assert.equal(disambiguatedFollowUp.intent, 'change_hours');

  // 3. Explicit request naming the service («غيّر أوقات العمل في المطعم: يومياً 10ص إلى 12م») -> Resolves immediately without asking
  const explicitRes = resolveMultiServiceCommand(
    'غيّر أوقات العمل في المطعم: يومياً 10ص إلى 12م',
    threeServices
  );
  assert.equal(explicitRes.status, 'resolved');
  assert.equal(explicitRes.targetService?.username, 'mathaq-rest');
  assert.equal(explicitRes.intent, 'change_hours');
  assert.equal(explicitRes.extractedValue, 'يومياً 10ص إلى 12م');
  assert.ok(explicitRes.botReply.includes('مطعم مذاق الشرق'));

  // 4. Explicit request targeting booking service («غيّر أوقات العمل في الحجوزات: السبت - الخميس 9ص - 9م»)
  const bookingRes = resolveMultiServiceCommand(
    'غيّر أوقات العمل في الحجوزات: السبت - الخميس 9ص - 9م',
    threeServices
  );
  assert.equal(bookingRes.status, 'resolved');
  assert.equal(bookingRes.targetService?.username, 'noor-booking');
  assert.equal(bookingRes.extractedValue, 'السبت - الخميس 9ص - 9م');

  // 5. Creating a new service never mixes with existing services
  const createNewRes = resolveMultiServiceCommand('أريد إنشاء خدمة جديدة', threeServices);
  assert.equal(createNewRes.status, 'create_new_service');
});

test('parseStudioEditCommand routes to focused single-part panels, color changes, styles, save, and close', () => {
  const saveRes = parseStudioEditCommand('حفظ', 'دار آروما');
  assert.equal(saveRes.action, 'save_changes');

  const closeRes = parseStudioEditCommand('العودة للمحادثة', 'دار آروما');
  assert.equal(closeRes.action, 'close_panel');

  const templateRes = parseStudioEditCommand('تعديل القالب', 'دار آروما');
  assert.equal(templateRes.action, 'open_panel');
  assert.equal(templateRes.panel, 'template');

  const colorsRes = parseStudioEditCommand('تعديل الألوان والشعار', 'دار آروما');
  assert.equal(colorsRes.action, 'open_panel');
  assert.equal(colorsRes.panel, 'colors');

  const productsRes = parseStudioEditCommand('إدارة المنتجات', 'دار آروما');
  assert.equal(productsRes.action, 'open_panel');
  assert.equal(productsRes.panel, 'products');

  const contentRes = parseStudioEditCommand('تعديل المحتوى والنصوص', 'دار آروما');
  assert.equal(contentRes.action, 'open_panel');
  assert.equal(contentRes.panel, 'content');

  const contactRes = parseStudioEditCommand('تعديل أرقام التواصل وساعات العمل', 'دار آروما');
  assert.equal(contactRes.action, 'open_panel');
  assert.equal(contactRes.panel, 'contact');

  const settingsRes = parseStudioEditCommand('إعدادات الرابط', 'دار آروما');
  assert.equal(settingsRes.action, 'open_panel');
  assert.equal(settingsRes.panel, 'settings');

  const previewRes = parseStudioEditCommand('معاينة الموقع', 'دار آروما');
  assert.equal(previewRes.action, 'open_panel');
  assert.equal(previewRes.panel, 'preview');

  const resultsRes = parseStudioEditCommand('النتائج والردود', 'دار آروما');
  assert.equal(resultsRes.action, 'open_panel');
  assert.equal(resultsRes.panel, 'results');

  const colorRes = parseStudioEditCommand('غير اللون إلى أخضر زمردي', 'دار آروما');
  assert.equal(colorRes.action, 'set_theme_color');
  assert.equal(colorRes.themeColor, '#059669');

  const styleRes = parseStudioEditCommand('اختر النمط السينمائي', 'دار آروما');
  assert.equal(styleRes.action, 'set_template_style');
  assert.equal(styleRes.templateStyle, 'cinematic');
});

