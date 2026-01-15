'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addFavorite,
  analyzeListingImage,
  createListing,
  deleteListing,
  fetchCars,
  fetchFavorites,
  fetchDealers,
  fetchMakes,
  fetchMyListings,
  fetchMyListingsAnalytics,
  getAnalytics,
  getPriceEstimate,
  handleChatbotMessage,
  handleListingAssistantMessage,
  MyListingsAnalytics,
  removeFavorite,
  semanticSearch,
  updateListing,
  uploadListingImage,
  uploadListingVideo,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  AnalyticsInsights,
  Car,
  CarFilters,
  ChatMessage,
  ChatSession,
  CurrencyCode,
  DealerSummary,
  PriceEstimatePayload,
  VisionAttributes,
} from '@/lib/types';
import { CHAT_HISTORY_LIMIT, STORAGE_KEYS } from '@/lib/config';
import { getAllMakes, getModelsForMake } from '@/lib/vehicleDatabase';

// Make/model options for Add Listing come from comprehensive vehicle database
// Filter makes come from actual database listings

const NAV_CONFIG = [
  { key: 'listings', labelKey: 'navCatalog', descriptionKey: 'navCatalogDesc' },
  { key: 'favorites', labelKey: 'navFavorites', descriptionKey: 'navFavoritesDesc' },
  { key: 'dealers', labelKey: 'navDealers', descriptionKey: 'navDealersDesc' },
  { key: 'myListings', labelKey: 'navMyListings', descriptionKey: 'navMyListingsDesc' },
  { key: 'addListing', labelKey: 'navAddListing', descriptionKey: 'navAddListingDesc' },
  { key: 'profile', labelKey: 'navProfile', descriptionKey: 'navProfileDesc' },
  { key: 'chatbot', labelKey: 'navChatbot', descriptionKey: 'navChatbotDesc' },
  { key: 'analytics', labelKey: 'navAnalytics', descriptionKey: 'navAnalyticsDesc' },
] as const;

type PageKey = (typeof NAV_CONFIG)[number]['key'];

const SERVICE_CONFIG = [
  { key: 'marketplace', labelKey: 'serviceMarketplace', descriptionKey: 'serviceMarketplaceDesc', defaultPage: 'listings' as PageKey },
  { key: 'dealer', labelKey: 'serviceDealer', descriptionKey: 'serviceDealerDesc', defaultPage: 'myListings' as PageKey },
  { key: 'insights', labelKey: 'serviceInsights', descriptionKey: 'serviceInsightsDesc', defaultPage: 'chatbot' as PageKey },
] as const;

type ServiceMode = (typeof SERVICE_CONFIG)[number]['key'];

const SERVICE_NAV_MAP: Record<ServiceMode, PageKey[]> = {
  marketplace: ['listings', 'favorites', 'dealers', 'myListings', 'addListing', 'profile'],
  dealer: ['listings', 'dealers', 'myListings', 'addListing', 'profile', 'analytics'],
  insights: ['chatbot', 'analytics', 'listings', 'favorites', 'profile'],
};

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_OPTIONS: Array<{ value: ThemeMode; labelKey: 'themeLight' | 'themeDark' | 'themeSystem' }> = [
  { value: 'light', labelKey: 'themeLight' },
  { value: 'dark', labelKey: 'themeDark' },
  { value: 'system', labelKey: 'themeSystem' },
];

const TRANSLATIONS = {
  en: {
    tagline: 'Intelligent automotive marketplace',
    statusLabel: 'Status',
    statusGuest: 'Guest',
    statusAuthenticated: 'Authenticated',
    selectorsCurrency: 'Currency',
    selectorsLanguage: 'Language',
    serviceLabel: 'Workspace',
    serviceSubtitle: 'Choose a capability focus',
    serviceCurrent: 'Currently exploring',
    serviceMarketplace: 'Marketplace',
    serviceMarketplaceDesc: 'Live inventory & customers',
    serviceDealer: 'Dealer Hub',
    serviceDealerDesc: 'Manage listings & leads',
    serviceInsights: 'AI Insights',
    serviceInsightsDesc: 'Chat, analytics, vision',
    serviceMenuCta: 'Switch workspace',
    navMenuLabel: 'Browse sections',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    settingsButton: 'Settings',
    settingsTitle: 'Workspace settings',
    settingsSubtitle: 'Personalize your experience',
    settingsProfileCta: 'Manage profile',
    settingsProfileGuest: 'Sign in / Sign up',
    navCatalog: 'Catalog',
    navCatalogDesc: 'Explore the latest inventory',
    navFavorites: 'Favorites',
    navFavoritesDesc: 'Your saved picks',
    navDealers: 'Dealers',
    navDealersDesc: 'Meet verified sellers',
    navMyListings: 'My Listings',
    navMyListingsDesc: 'Manage your cars',
    navAddListing: 'Add Listing',
    navAddListingDesc: 'Create a new listing',
    navProfile: 'Profile & Auth',
    navProfileDesc: 'Account settings',
    navChatbot: 'AI Assistant',
    navChatbotDesc: 'Chat & vision tools',
    navAnalytics: 'Analytics',
    navAnalyticsDesc: 'Market intelligence',
    searchPlaceholder: 'Search make, model, year',
    semanticPlaceholder: 'e.g. Luxury hybrid SUV under 150k',
    dropPrompt: 'Drag & drop or paste an image',
    dropHint: 'JPG, PNG up to 10MB',
    priceAssistLabel: 'AI Price Assist',
    uploadPhotoLabel: 'Upload Photo',
    visionHelperLabel: 'Vision Helper',
    galleryLabel: 'Gallery',
    galleryHint: 'Attach up to 6 showcase shots',
    galleryEmpty: 'No gallery images yet.',
    galleryUploadLabel: 'Upload images',
    galleryAddButton: 'Add',
    galleryRemove: 'Remove',
    videoLabel: 'Video link',
    makeSelectLabel: 'Choose make',
    modelSelectLabel: 'Choose model',
    engineSelectLabel: 'Choose engine',
    odometerLabel: 'Odometer (km)',
    descriptionHeading: 'Description',
    dealersHeading: 'Featured dealer network',
    dealersSubheading: 'Shop curated showrooms powered by IntelliWheels partners.',
    dealersEmpty: 'No dealer partners are live yet.',
    dealersVisit: 'View showroom',
    dealerMetaListings: 'Listings',
    dealerMetaAverage: 'Avg price',
    dealerMetaTopMakes: 'Top makes',
    dealerInventoryTitle: 'Available cars',
    dealerContactCta: 'Contact dealer',
    settingsLabel: 'Settings',
    settingsTheme: 'Theme',
    settingsLanguage: 'Language',
    settingsCurrency: 'Currency',
    footerContact: 'Contact',
    footerSupport: 'Support',
    footerSocial: 'Social',
    footerRights: 'All rights reserved.',
    footerEmail: 'Email us',
    footerPhone: 'Call support',
    footerInstagram: 'Instagram',
    // Chat & AI Assistant
    chatNewChat: 'New Chat',
    chatRecent: 'Recent',
    chatMode: 'Mode',
    chatModeGeneral: '💬 General Q&A',
    chatModeListing: '📝 Listing Assistant',
    chatAssistantName: 'IntelliWheels AI',
    chatGeneralAssistant: 'General Assistant',
    chatListingAssistant: 'Listing Assistant',
    chatThinking: 'Thinking...',
    chatWelcome: 'How can I help you today?',
    chatWelcomeDesc: 'Ask me about car pricing, specifications, comparisons, or let me help you create a listing.',
    chatSuggestion1: 'Compare Toyota vs Honda',
    chatSuggestion2: 'Price a 2022 BMW X5',
    chatSuggestion3: 'Help me list my car',
    chatPlaceholder: 'Ask about cars, pricing, or type / for commands...',
    chatSendHint: 'Press Enter to send, Shift+Enter for new line',
    chatImageAttached: 'Image attached',
    chatProposedListing: '📋 Proposed Listing',
    chatDeleteChat: 'Delete chat',
    chatStopGenerating: 'Stop generating',
    chatSendMessage: 'Send message',
    // Auth & Profile
    authSignIn: 'Sign In',
    authSignUp: 'Sign Up',
    authSignOut: 'Sign Out',
    authUsername: 'Username',
    authEmail: 'Email',
    authPassword: 'Password',
    authCurrentPassword: 'Current password',
    authNewPassword: 'New password',
    authCreateAccount: 'Create Account',
    authWelcomeBack: 'Welcome back',
    authManageAccount: 'Manage account',
    profileTitle: 'Profile',
    profileUpdate: 'Update Profile',
    profileRefresh: 'Refresh Profile',
    profileSaveChanges: 'Save Changes',
    profileSignInPrompt: 'Sign in to manage your account and unlock favorites, listings, and analytics.',
    // Listings & Cars
    listingViewDetails: 'View Details',
    listingFavorite: 'Favorite',
    listingFavorited: 'Favorited',
    listingPublish: 'Publish Listing',
    listingPublishing: 'Publishing...',
    listingReviews: 'reviews',
    listingPhotos: 'photos',
    listingVideo: 'Video',
    listingYear: 'Year',
    listingPrice: 'Price',
    listingBodyStyle: 'Body Style',
    listingHorsepower: 'Horsepower',
    listingFuelEconomy: 'Fuel Economy',
    // Filters & Search
    filterAllMakes: 'All Makes',
    filterRecommended: 'Recommended',
    filterPriceLowHigh: 'Price: Low → High',
    filterPriceHighLow: 'Price: High → Low',
    filterNewerFirst: 'Newer first',
    filterTopRated: 'Top rated',
    searchAiSemantic: 'AI Semantic Search',
    searchSearching: 'Searching...',
    searchSearch: 'Search',
    searchNoResults: 'No matching cars found',
    searchInspect: 'Inspect',
    // Analytics
    analyticsAll: 'All',
    analyticsMy: 'My',
    analyticsFavorites: 'Favorites',
    analyticsAvgPrice: 'Average Price',
    analyticsCheapest: 'Cheapest',
    analyticsMostExpensive: 'Most Expensive',
    analyticsTopMakes: 'Top Makes',
    analyticsListings: 'listings',
    analyticsNoData: 'No analytics available yet. Create listings or favorites to unlock insights.',
    // Pagination
    paginationShowing: 'Showing',
    paginationOf: 'of',
    paginationListings: 'listings',
    paginationPrev: 'Prev',
    paginationNext: 'Next',
    // Vision Helper
    visionTipsTitle: 'Vision Helper Tips',
    visionTipsDesc: 'Upload clear daylight shots. The AI will detect make, model, color, and condition to pre-fill your listing.',
    visionAnalyzing: 'Analyzing image...',
    // General
    loading: 'Loading...',
    loadingAccount: 'Loading account...',
    loadingDealers: 'Loading dealers...',
    noListings: 'No listings match your filters yet.',
    noFavorites: 'No favorites yet.',
  },
  ar: {
    tagline: 'منصة سيارات ذكية',
    statusLabel: 'الحالة',
    statusGuest: 'زائر',
    statusAuthenticated: 'مسجل',
    selectorsCurrency: 'العملة',
    selectorsLanguage: 'اللغة',
    serviceLabel: 'بيئة العمل',
    serviceSubtitle: 'اختر نمط الخدمة الأنسب',
    serviceCurrent: 'أنت الآن في',
    serviceMarketplace: 'السوق',
    serviceMarketplaceDesc: 'المخزون المباشر والعملاء',
    serviceDealer: 'مركز الوكلاء',
    serviceDealerDesc: 'إدارة العروض والعملاء المحتملين',
    serviceInsights: 'رؤى الذكاء',
    serviceInsightsDesc: 'الدردشة والتحليلات والرؤية',
    serviceMenuCta: 'تغيير مساحة العمل',
    navMenuLabel: 'تصفح الأقسام',
    themeLabel: 'الوضع',
    themeLight: 'فاتح',
    themeDark: 'داكن',
    themeSystem: 'حسب النظام',
    settingsButton: 'الإعدادات',
    settingsTitle: 'إعدادات مساحة العمل',
    settingsSubtitle: 'خصص تجربتك',
    settingsProfileCta: 'إدارة الحساب',
    settingsProfileGuest: 'تسجيل الدخول / إنشاء حساب',
    navCatalog: 'الكتالوج',
    navCatalogDesc: 'اكتشف أحدث السيارات',
    navFavorites: 'المفضلة',
    navFavoritesDesc: 'سياراتك المختارة',
    navDealers: 'الوكلاء',
    navDealersDesc: 'تعرف على شركائنا المعتمدين',
    navMyListings: 'سياراتي',
    navMyListingsDesc: 'إدارة السيارات المعروضة',
    navAddListing: 'إضافة سيارة',
    navAddListingDesc: 'إنشاء عرض جديد',
    navProfile: 'الملف الشخصي',
    navProfileDesc: 'إدارة الحساب',
    navChatbot: 'المساعد الذكي',
    navChatbotDesc: 'دردشة ورؤية بالذكاء الاصطناعي',
    navAnalytics: 'التحليلات',
    navAnalyticsDesc: 'رؤى السوق',
    searchPlaceholder: 'ابحث عن الموديل أو السنة',
    semanticPlaceholder: 'مثال: سيارة هجينة فاخرة أقل من 150 ألف',
    dropPrompt: 'اسحب وأفلت أو الصق صورة هنا',
    dropHint: 'صور ‎JPG, PNG‎ حتى 10 ميغابايت',
    priceAssistLabel: 'مساعد التسعير بالذكاء الاصطناعي',
    uploadPhotoLabel: 'تحميل صورة',
    visionHelperLabel: 'مساعد الرؤية',
    galleryLabel: 'معرض الصور',
    galleryHint: 'أضف حتى ٦ صور مميزة',
    galleryEmpty: 'لا توجد صور بعد.',
    galleryUploadLabel: 'رفع الصور',
    galleryAddButton: 'إضافة',
    galleryRemove: 'إزالة',
    videoLabel: 'رابط الفيديو',
    makeSelectLabel: 'اختر الشركة',
    modelSelectLabel: 'اختر الموديل',
    engineSelectLabel: 'اختر المحرك',
    odometerLabel: 'قراءة العداد (كم)',
    descriptionHeading: 'الوصف',
    dealersHeading: 'شبكة الوكلاء المميزين',
    dealersSubheading: 'استكشف صالات العرض المختارة من شركاء إنتلي ويلز.',
    dealersEmpty: 'لا يوجد وكلاء نشطون حالياً.',
    dealersVisit: 'عرض الصالة',
    dealerMetaListings: 'العروض',
    dealerMetaAverage: 'متوسط السعر',
    dealerMetaTopMakes: 'أبرز العلامات',
    dealerInventoryTitle: 'السيارات المتاحة',
    dealerContactCta: 'تواصل مع الوكيل',
    settingsLabel: 'الإعدادات',
    settingsTheme: 'المظهر',
    settingsLanguage: 'اللغة',
    settingsCurrency: 'العملة',
    footerContact: 'تواصل معنا',
    footerSupport: 'الدعم',
    footerSocial: 'وسائل التواصل',
    footerRights: 'جميع الحقوق محفوظة.',
    footerEmail: 'راسلنا',
    footerPhone: 'اتصل بالدعم',
    footerInstagram: 'إنستغرام',
    // Chat & AI Assistant - المساعد الذكي والدردشة
    chatNewChat: 'محادثة جديدة',
    chatRecent: 'الأخيرة',
    chatMode: 'الوضع',
    chatModeGeneral: '💬 أسئلة عامة',
    chatModeListing: '📝 مساعد الإعلانات',
    chatAssistantName: 'مساعد إنتلي ويلز الذكي',
    chatGeneralAssistant: 'المساعد العام',
    chatListingAssistant: 'مساعد الإعلانات',
    chatThinking: 'جاري التفكير...',
    chatWelcome: 'كيف يمكنني مساعدتك اليوم؟',
    chatWelcomeDesc: 'اسألني عن أسعار السيارات، المواصفات، المقارنات، أو دعني أساعدك في إنشاء إعلان.',
    chatSuggestion1: 'قارن بين تويوتا وهوندا',
    chatSuggestion2: 'سعر BMW X5 موديل 2022',
    chatSuggestion3: 'ساعدني في بيع سيارتي',
    chatPlaceholder: 'اسأل عن السيارات، الأسعار، أو اكتب / للأوامر...',
    chatSendHint: 'اضغط Enter للإرسال، Shift+Enter لسطر جديد',
    chatImageAttached: 'تم إرفاق صورة',
    chatProposedListing: '📋 الإعلان المقترح',
    chatDeleteChat: 'حذف المحادثة',
    chatStopGenerating: 'إيقاف التوليد',
    chatSendMessage: 'إرسال الرسالة',
    // Auth & Profile - المصادقة والملف الشخصي
    authSignIn: 'تسجيل الدخول',
    authSignUp: 'إنشاء حساب',
    authSignOut: 'تسجيل الخروج',
    authUsername: 'اسم المستخدم',
    authEmail: 'البريد الإلكتروني',
    authPassword: 'كلمة المرور',
    authCurrentPassword: 'كلمة المرور الحالية',
    authNewPassword: 'كلمة المرور الجديدة',
    authCreateAccount: 'إنشاء حساب جديد',
    authWelcomeBack: 'مرحباً بعودتك',
    authManageAccount: 'إدارة الحساب',
    profileTitle: 'الملف الشخصي',
    profileUpdate: 'تحديث الملف الشخصي',
    profileRefresh: 'تحديث البيانات',
    profileSaveChanges: 'حفظ التغييرات',
    profileSignInPrompt: 'سجل الدخول لإدارة حسابك وفتح المفضلة والإعلانات والتحليلات.',
    // Listings & Cars - الإعلانات والسيارات
    listingViewDetails: 'عرض التفاصيل',
    listingFavorite: 'إضافة للمفضلة',
    listingFavorited: 'في المفضلة',
    listingPublish: 'نشر الإعلان',
    listingPublishing: 'جاري النشر...',
    listingReviews: 'تقييمات',
    listingPhotos: 'صور',
    listingVideo: 'فيديو',
    listingYear: 'السنة',
    listingPrice: 'السعر',
    listingBodyStyle: 'نوع الهيكل',
    listingHorsepower: 'قوة المحرك',
    listingFuelEconomy: 'استهلاك الوقود',
    // Filters & Search - الفلاتر والبحث
    filterAllMakes: 'جميع الشركات',
    filterRecommended: 'موصى به',
    filterPriceLowHigh: 'السعر: من الأقل للأعلى',
    filterPriceHighLow: 'السعر: من الأعلى للأقل',
    filterNewerFirst: 'الأحدث أولاً',
    filterTopRated: 'الأعلى تقييماً',
    searchAiSemantic: 'البحث الذكي بالذكاء الاصطناعي',
    searchSearching: 'جاري البحث...',
    searchSearch: 'بحث',
    searchNoResults: 'لم يتم العثور على سيارات مطابقة',
    searchInspect: 'فحص',
    // Analytics - التحليلات
    analyticsAll: 'الكل',
    analyticsMy: 'إعلاناتي',
    analyticsFavorites: 'المفضلة',
    analyticsAvgPrice: 'متوسط السعر',
    analyticsCheapest: 'الأرخص',
    analyticsMostExpensive: 'الأغلى',
    analyticsTopMakes: 'أشهر الشركات',
    analyticsListings: 'إعلانات',
    analyticsNoData: 'لا توجد تحليلات بعد. أنشئ إعلانات أو أضف للمفضلة لفتح الرؤى.',
    // Pagination - التصفح
    paginationShowing: 'عرض',
    paginationOf: 'من',
    paginationListings: 'إعلانات',
    paginationPrev: 'السابق',
    paginationNext: 'التالي',
    // Vision Helper - مساعد الرؤية
    visionTipsTitle: 'نصائح مساعد الرؤية',
    visionTipsDesc: 'ارفع صوراً واضحة في ضوء النهار. سيقوم الذكاء الاصطناعي بتحديد الشركة، الموديل، اللون، والحالة لملء إعلانك تلقائياً.',
    visionAnalyzing: 'جاري تحليل الصورة...',
    // General - عام
    loading: 'جاري التحميل...',
    loadingAccount: 'جاري تحميل الحساب...',
    loadingDealers: 'جاري تحميل الوكلاء...',
    noListings: 'لا توجد إعلانات تطابق الفلاتر المحددة.',
    noFavorites: 'لا توجد مفضلات بعد.',
  },
} as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
] as const;

const CURRENCY_OPTIONS: CurrencyCode[] = ['JOD', 'AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'BHD', 'KWD', 'OMR'];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'car', label: 'Cars' },
  { value: 'suv', label: 'SUVs' },
  { value: 'truck', label: 'Trucks' },
  { value: 'bike', label: 'Motorcycles' },
  { value: 'van', label: 'Vans' },
  { value: 'bus', label: 'Buses' },
  { value: 'other', label: 'Other' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'certified', label: 'Certified Pre-Owned' },
];

const TRANSMISSION_OPTIONS = [
  { value: '', label: 'Select Transmission' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'cvt', label: 'CVT' },
  { value: 'other', label: 'Other' },
];

const FUEL_TYPE_OPTIONS = [
  { value: '', label: 'Select Fuel Type' },
  { value: 'petrol', label: 'Petrol/Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'plugin_hybrid', label: 'Plug-in Hybrid' },
  { value: 'lpg', label: 'LPG' },
  { value: 'other', label: 'Other' },
];

const REGIONAL_SPEC_OPTIONS = [
  { value: '', label: 'Select Regional Spec' },
  { value: 'gcc', label: 'GCC Specs' },
  { value: 'american', label: 'American Specs' },
  { value: 'european', label: 'European Specs' },
  { value: 'japanese', label: 'Japanese Specs' },
  { value: 'korean', label: 'Korean Specs' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: 'cash', label: 'Cash Only' },
  { value: 'installments', label: 'Installments Only' },
  { value: 'both', label: 'Cash or Installments' },
];

const DEFAULT_FILTERS: CarFilters = {
  make: 'all',
  search: '',
  sort: 'default',
  category: 'all',
};

const LISTINGS_PER_PAGE = 10;

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ListingFormState {
  make: string;
  model: string;
  year: string;
  price: string;
  currency: string;
  bodyStyle: string;
  horsepower: string;
  engine: string;
  fuelEconomy: string;
  odometer: string;
  image: string;
  galleryImages: string[];
  videoUrls: string[];
  description: string;
  // New fields
  category: string;
  condition: string;
  exteriorColor: string;
  interiorColor: string;
  transmission: string;
  fuelType: string;
  regionalSpec: string;
  paymentType: string;
  city: string;
  neighborhood: string;
  trim: string;
}

interface VisionSuggestion extends VisionAttributes {
  raw?: string;
}

export function AppView() {
  const { user, token, loading: authLoading, login, signup, logout, updateMyProfile, refreshProfile, error: authError, clearError, currency, setCurrency, formatPrice, convertCurrency } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<PageKey>('listings');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('marketplace');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [filters, setFilters] = useState<CarFilters>(DEFAULT_FILTERS);
  const [cars, setCars] = useState<Car[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [dealersLoading, setDealersLoading] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [myListings, setMyListings] = useState<Car[]>([]);
  const [myListingsAnalytics, setMyListingsAnalytics] = useState<MyListingsAnalytics | null>(null);
  const [myListingsAnalyticsLoading, setMyListingsAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsInsights | null>(null);
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'my' | 'favorites'>('all');
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<Car[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [editingListing, setEditingListing] = useState<Car | null>(null);
  const [editForm, setEditForm] = useState<ListingFormState>({
    make: '',
    model: '',
    year: '',
    price: '',
    currency: 'JOD',
    bodyStyle: '',
    horsepower: '',
    engine: '',
    fuelEconomy: '',
    odometer: '',
    image: '',
    galleryImages: [],
    videoUrls: [],
    description: '',
    category: 'car',
    condition: 'used',
    exteriorColor: '',
    interiorColor: '',
    transmission: '',
    fuelType: '',
    regionalSpec: '',
    paymentType: 'cash',
    city: '',
    neighborhood: '',
    trim: '',
  });
  const [listingForm, setListingForm] = useState<ListingFormState>({
    make: '',
    model: '',
    year: '',
    price: '',
    currency: 'JOD',
    bodyStyle: '',
    horsepower: '',
    engine: '',
    fuelEconomy: '',
    odometer: '',
    image: '',
    galleryImages: [],
    videoUrls: [],
    description: '',
    category: 'car',
    condition: 'used',
    exteriorColor: '',
    interiorColor: '',
    transmission: '',
    fuelType: '',
    regionalSpec: '',
    paymentType: 'cash',
    city: '',
    neighborhood: '',
    trim: '',
  });
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<{ value: number; currency: CurrencyCode; range?: { low: number; high: number } } | null>(null);
  const [visionSuggestion, setVisionSuggestion] = useState<VisionSuggestion | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState<'general' | 'listing'>('general');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatAbortController, setChatAbortController] = useState<AbortController | null>(null);
  const [chatAttachment, setChatAttachment] = useState<{ preview: string; base64: string; mime: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const serviceMenuRef = useRef<HTMLDivElement | null>(null);
  const navMenuRef = useRef<HTMLDivElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const headerSearchRef = useRef<HTMLInputElement | null>(null);
  const resolvedTheme = theme === 'system' ? 'light' : theme;
  const currentService = SERVICE_CONFIG.find((service) => service.key === serviceMode) ?? SERVICE_CONFIG[0];
  const router = useRouter();

  const copy = TRANSLATIONS[language];
  const apiHost = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    return base.replace(/\/api$/, '');
  }, []);
  
  // Comprehensive vehicle database for Add Listing form (all production vehicles)
  const allVehicleMakes = useMemo(() => getAllMakes(), []);
  const listingModelOptions = useMemo(
    () => listingForm.make ? getModelsForMake(listingForm.make) : [],
    [listingForm.make]
  );
  
  // Allow custom make/model if not in database
  const availableMakeOptions = useMemo(() => {
    if (!listingForm.make || allVehicleMakes.includes(listingForm.make)) {
      return allVehicleMakes;
    }
    return [...allVehicleMakes, listingForm.make].sort((a, b) => a.localeCompare(b));
  }, [listingForm.make, allVehicleMakes]);
  
  const availableModelOptions = useMemo(() => {
    if (!listingForm.model || listingModelOptions.includes(listingForm.model)) {
      return listingModelOptions;
    }
    return [...listingModelOptions, listingForm.model].sort((a, b) => a.localeCompare(b));
  }, [listingForm.model, listingModelOptions]);
  
  // Engine is free text input since it varies too much
  const availableEngineOptions: string[] = [];
  const direction = language === 'ar' ? 'rtl' : 'ltr';
  const backgroundClass = resolvedTheme === 'dark'
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-50 text-slate-900';
  // Background with elegant gradient - provides professional look without external image dependency
  const backgroundImageStyle = {
    backgroundImage: resolvedTheme === 'dark'
      ? 'linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 25%, rgba(51, 65, 85, 0.9) 50%, rgba(30, 58, 138, 0.8) 75%, rgba(14, 165, 233, 0.6) 100%)'
      : 'linear-gradient(135deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 25%, rgba(226, 232, 240, 0.95) 50%, rgba(186, 230, 253, 0.8) 75%, rgba(56, 189, 248, 0.4) 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat',
  };
  const headerSurfaceClass = resolvedTheme === 'dark'
    ? 'bg-slate-800/95 border-b border-slate-700/60 text-slate-100'
    : 'bg-slate-100/95 border-b border-slate-300/60 text-slate-900';
  const mainSurfaceClass = resolvedTheme === 'dark'
    ? 'border-slate-800 bg-slate-900/80 text-slate-100'
    : 'border-slate-100 bg-white/90 text-slate-900';
  const headerMuted = resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const headerSubtleText = resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600';
  const selectorClass = resolvedTheme === 'dark'
    ? 'rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100'
    : 'rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900';
  const statusPillClass = mounted && token
    ? 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
    : resolvedTheme === 'dark'
      ? 'border border-blue-500/30 bg-blue-900/40 text-blue-200'
      : 'border border-slate-200 bg-white/20 text-white';
  const subtleBorderClass = resolvedTheme === 'dark' ? 'border-blue-900/30' : 'border-sky-900/40';
  const navActiveItemClass = resolvedTheme === 'dark'
    ? 'bg-blue-900/60 text-slate-50'
    : 'bg-slate-100 text-slate-900';
  const navIdleItemClass = resolvedTheme === 'dark'
    ? 'text-slate-200 hover:bg-blue-900/40'
    : 'text-slate-700 hover:bg-slate-100';
  const navItems = useMemo(() => {
    const allowedKeys = new Set(SERVICE_NAV_MAP[serviceMode] ?? NAV_CONFIG.map((item) => item.key));
    return NAV_CONFIG.filter((item) => allowedKeys.has(item.key)).map((item) => ({
      key: item.key,
      label: copy[item.labelKey],
      description: copy[item.descriptionKey],
    }));
  }, [language, serviceMode]);
  const handleOpenCarDetails = useCallback(
    (carId: number) => {
      router.push(`/cars/${carId}`);
    },
    [router]
  );
  const handleOpenDealer = useCallback(
    (dealerId: number) => {
      router.push(`/dealers/${dealerId}`);
    },
    [router]
  );
  const inputFieldClass = 'rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none';

  const chatSession = useMemo(() => chatSessions.find((session) => session.id === activeSessionId) ?? null, [chatSessions, activeSessionId]);
  const chatMessages = chatSession?.messages ?? [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedService = localStorage.getItem(STORAGE_KEYS.serviceMode) as ServiceMode | null;
    if (storedService && SERVICE_NAV_MAP[storedService]) {
      setServiceMode((prev) => (prev === storedService ? prev : storedService));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode | null;
    if (storedTheme) {
      setTheme((prev) => (prev === storedTheme ? prev : storedTheme));
    }
  }, []);

  // User-specific chat storage key
  const userChatStorageKey = useMemo(() => {
    if (!user?.id) return null;
    return `${STORAGE_KEYS.chatSessions}-${user.id}`;
  }, [user?.id]);

  // Load chat sessions for current user
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!userChatStorageKey) {
      // Clear chat sessions when user logs out
      setChatSessions([]);
      setActiveSessionId(null);
      return;
    }
    const storedSessions = localStorage.getItem(userChatStorageKey);
    if (!storedSessions) {
      setChatSessions([]);
      setActiveSessionId(null);
      return;
    }
    try {
      const parsed = JSON.parse(storedSessions);
      if (Array.isArray(parsed)) {
        setChatSessions(parsed);
        setActiveSessionId((prev) => prev ?? parsed[0]?.id ?? null);
      }
    } catch (err) {
      console.warn('Failed to parse chat sessions', err);
      setChatSessions([]);
    }
  }, [userChatStorageKey]);

  useEffect(() => {
    if (activeSessionId || !chatSessions.length) return;
    setActiveSessionId(chatSessions[0].id);
  }, [chatSessions, activeSessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.serviceMode, serviceMode);
  }, [serviceMode]);

  useEffect(() => {
    const allowedPages = SERVICE_NAV_MAP[serviceMode] ?? NAV_CONFIG.map((item) => item.key);
    // Don't force redirect if trying to access pages that might be conditionally allowed or are valid
    // Explicitly allow 'chatbot', 'analytics', 'add_listing' to prevent flashing/redirect loops
    const alwaysAllowed = ['chatbot', 'analytics', 'add_listing', 'profile'];

    if (!allowedPages.includes(activePage) && !alwaysAllowed.includes(activePage)) {
      if (activePage !== 'profile') {
        setActivePage(allowedPages[0] ?? 'listings');
      }
    }
  }, [serviceMode, activePage]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (serviceMenuOpen && serviceMenuRef.current && !serviceMenuRef.current.contains(target)) {
        setServiceMenuOpen(false);
      }
      if (navMenuOpen && navMenuRef.current && !navMenuRef.current.contains(target)) {
        setNavMenuOpen(false);
      }
      if (settingsOpen && settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setSettingsOpen(false);
      }
      if (headerSearchOpen && headerSearchRef.current && !headerSearchRef.current.contains(target)) {
        setHeaderSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [serviceMenuOpen, navMenuOpen, settingsOpen, headerSearchOpen]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setServiceMenuOpen(false);
        setNavMenuOpen(false);
        setSettingsOpen(false);
        setHeaderSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const resolveImageUrl = useCallback(
    (src?: string | null) => {
      if (!src) return '/placeholder-car.png';
      if (src.startsWith('http')) return src;
      if (src.startsWith('data:')) return src;
      if (!apiHost) return src;
      return `${apiHost}${src.startsWith('/') ? src : `/${src}`}`;
    },
    [apiHost]
  );

  const getCarImage = useCallback(
    (car: Car) => {
      if (car.image) {
        return resolveImageUrl(car.image);
      }
      if (car.galleryImages?.length) {
        return resolveImageUrl(car.galleryImages[0]);
      }
      const mediaPreview = car.mediaGallery?.find((entry) => entry.type === 'image' && entry.url)?.url;
      if (mediaPreview) {
        return resolveImageUrl(mediaPreview);
      }
      if (car.imageUrls?.length) {
        return resolveImageUrl(car.imageUrls[0]);
      }
      return '/placeholder-car.png';
    },
    [resolveImageUrl]
  );

  const requireAuth = useCallback(() => {
    if (!token) {
      setToast({ type: 'info', message: 'Please sign in to access this feature.' });
      setActivePage('profile');
      return false;
    }
    return true;
  }, [token]);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCars() {
      try {
        const response = await fetchCars(filters, controller.signal, token);
        if (response.success) {
          setCars(response.cars || []);
        }
      } catch (err: any) {
        // Ignore abort errors (expected when component unmounts or re-renders)
        if (err?.name === 'AbortError') return;
        console.warn('Failed to load cars', err);
        // Only redirect if explicitly rejected and not already on a vital public page
        if (typeof err?.message === 'string' && err.message.toLowerCase().includes('auth') && activePage !== 'listings' && activePage !== 'dealers') {
          // Don't auto-redirect, just let the user see the restricted content message or handle it locally
        }
      }
    }
    loadCars();
    return () => controller.abort();
  }, [filters, token, requireAuth]);

  useEffect(() => {
    async function loadMakes() {
      try {
        const response = await fetchMakes(token);
        if (response.success) {
          const deduped = Array.from(new Set(['all', ...(response.makes || [])]));
          setMakes(deduped);
        }
      } catch (err: any) {
        console.warn('Failed to load makes', err);
        if (typeof err?.message === 'string' && err.message.toLowerCase().includes('auth')) {
          requireAuth();
        }
      }
    }
    loadMakes();
  }, [token, requireAuth]);

  useEffect(() => {
    if (!token) {
      setFavorites([]);
      setFavoriteCars([]);
      setMyListings([]);
      setMyListingsAnalytics(null);
      return;
    }

    async function hydrateAuthorizedData() {
      try {
        const [favoritesResponse, listingsResponse] = await Promise.all([
          fetchFavorites(token),
          fetchMyListings(token),
        ]);
        if (favoritesResponse.success) {
          const favCars = favoritesResponse.cars || [];
          setFavoriteCars(favCars);
          setFavorites(favCars.map((car) => car.id));
        }
        if (listingsResponse.success) {
          setMyListings(listingsResponse.cars || []);
        }
      } catch (err) {
        console.warn('Failed to load protected data', err);
      }
    }
    hydrateAuthorizedData();
  }, [token]);

  // Load my listings analytics when on myListings page
  useEffect(() => {
    if (!token || activePage !== 'myListings') {
      return;
    }
    async function loadMyListingsAnalytics() {
      setMyListingsAnalyticsLoading(true);
      try {
        const response = await fetchMyListingsAnalytics(token);
        if (response.success) {
          setMyListingsAnalytics(response.analytics);
        }
      } catch (err) {
        console.warn('Failed to load my listings analytics', err);
      } finally {
        setMyListingsAnalyticsLoading(false);
      }
    }
    loadMyListingsAnalytics();
  }, [token, activePage]);

  useEffect(() => {
    if (!token) {
      setAnalyticsData(null);
      return;
    }
    async function loadAnalytics() {
      try {
        const response = await getAnalytics(analyticsFilter, token);
        if (response.success) {
          setAnalyticsData(response.insights);
        }
      } catch (err) {
        console.warn('Failed to load analytics', err);
      }
    }
    loadAnalytics();
  }, [token, analyticsFilter]);

  useEffect(() => {
    if (!token) {
      setDealers([]);
      setDealersLoading(false);
      return;
    }
    let cancelled = false;
    async function loadDealerDirectory() {
      setDealersLoading(true);
      try {
        const response = await fetchDealers(token);
        if (!cancelled && response.success) {
          setDealers(response.dealers || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Failed to load dealers', err);
        }
      } finally {
        if (!cancelled) {
          setDealersLoading(false);
        }
      }
    }
    loadDealerDirectory();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userChatStorageKey) return;
    localStorage.setItem(userChatStorageKey, JSON.stringify(chatSessions));
  }, [chatSessions, userChatStorageKey]);

  const persistChatSession = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setChatSessions((prev) =>
      prev
        .map((session) =>
          session.id === sessionId
            ? {
              ...session,
              messages: messages.slice(-CHAT_HISTORY_LIMIT),
              updatedAt: new Date().toISOString(),
              title:
                session.title === 'New Chat' && messages.length
                  ? messages.find((msg) => msg.role === 'user')?.text.slice(0, 60) || 'Chat'
                  : session.title,
            }
            : session
        )
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    );
  }, []);

  const startNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, []);

  const deleteChatSession = useCallback((sessionId: string) => {
    setChatSessions((prev) => {
      const filtered = prev.filter((session) => session.id !== sessionId);
      // If deleting the active session, switch to another one
      if (sessionId === activeSessionId) {
        setActiveSessionId(filtered[0]?.id ?? null);
      }
      return filtered;
    });
  }, [activeSessionId]);

  const ensureSession = useCallback(() => {
    if (activeSessionId) return activeSessionId;
    return startNewChat();
  }, [activeSessionId, startNewChat]);

  const toggleFavorite = useCallback(
    async (car: Car) => {
      if (!requireAuth()) return;
      const isFavorited = favorites.includes(car.id);
      // Optimistically update both favorites IDs and favoriteCars array
      setFavorites((prev) =>
        isFavorited ? prev.filter((id) => id !== car.id) : [...prev, car.id]
      );
      setFavoriteCars((prev) =>
        isFavorited ? prev.filter((c) => c.id !== car.id) : [...prev, car]
      );
      try {
        if (isFavorited) {
          await removeFavorite(car.id, token);
          showToast('Removed from favorites', 'info');
        } else {
          await addFavorite(car.id, token);
          showToast('Added to favorites');
        }
      } catch (err) {
        showToast('Unable to update favorites', 'error');
        // Revert on error
        setFavorites((prev) =>
          isFavorited ? [...prev, car.id] : prev.filter((id) => id !== car.id)
        );
        setFavoriteCars((prev) =>
          isFavorited ? [...prev, car] : prev.filter((c) => c.id !== car.id)
        );
      }
    },
    [favorites, requireAuth, token, showToast]
  );

  const handleListingInput = (field: keyof ListingFormState, value: string) => {
    setListingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMakeSelect = (value: string) => {
    setListingForm((prev) => ({
      ...prev,
      make: value,
      model: '',
      engine: '',
    }));
  };

  const handleModelSelect = (value: string) => {
    setListingForm((prev) => ({
      ...prev,
      model: value,
      engine: '',
    }));
  };

  const hydrateFromVision = (attributes: VisionSuggestion) => {
    setListingForm((prev) => ({
      ...prev,
      make: attributes.make || prev.make,
      model: attributes.model || prev.model,
      year: attributes.year ? String(attributes.year) : prev.year,
      bodyStyle: attributes.bodyStyle || prev.bodyStyle,
      price: attributes.estimatedPrice ? String(attributes.estimatedPrice) : prev.price,
      description: attributes.conditionDescription || prev.description,
    }));
  };

  const handleVisionAnalyze = async (file: File) => {
    if (!requireAuth()) return;
    setVisionLoading(true);
    try {
      const base64 = await fileToDataUrl(file);
      const response = await analyzeListingImage({ image_base64: base64, mime_type: file.type }, token);
      if (response.success) {
        setVisionSuggestion({ ...response.attributes, raw: response.raw });
        hydrateFromVision(response.attributes);
        showToast('Vision helper filled the form');
      } else {
        const errorMessage = (response as { error?: string }).error;
        showToast(errorMessage || 'Vision helper failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Vision helper failed', 'error');
    } finally {
      setVisionLoading(false);
    }
  };

  const uploadImageAsset = useCallback(
    async (file: File) => {
      const response = await uploadListingImage(file, token);
      if (response.success && response.url) {
        return response.url;
      }
      const errorMessage = (response as { error?: string }).error;
      throw new Error(errorMessage || 'Upload failed');
    },
    [token]
  );

  const uploadVideoAsset = useCallback(
    async (file: File) => {
      const response = await uploadListingVideo(file, token);
      if (response.success && response.url) {
        return response.url;
      }
      const errorMessage = (response as { error?: string }).error;
      throw new Error(errorMessage || 'Video upload failed');
    },
    [token]
  );

  const handleUploadImage = async (file: File) => {
    if (!requireAuth()) return;
    try {
      const url = await uploadImageAsset(file);
      handleListingInput('image', url);
      showToast('Image uploaded');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    }
  };

  const handleGalleryUpload = async (fileList: FileList | null) => {
    if (!requireAuth() || !fileList || fileList.length === 0) return;
    try {
      // Calculate remaining slots (max 12 images)
      const remainingSlots = 12 - listingForm.galleryImages.length;
      if (remainingSlots <= 0) {
        showToast('Maximum 12 images allowed', 'info');
        return;
      }
      const uploads = Array.from(fileList).slice(0, remainingSlots);
      const uploadedUrls: string[] = [];
      for (const file of uploads) {
        // eslint-disable-next-line no-await-in-loop
        const url = await uploadImageAsset(file);
        uploadedUrls.push(url);
      }
      if (!uploadedUrls.length) return;
      setListingForm((prev) => {
        const combined = [...prev.galleryImages, ...uploadedUrls].slice(0, 12);
        const primaryImage = prev.image || combined[0] || '';
        return { ...prev, galleryImages: combined, image: primaryImage };
      });
      showToast(`${uploadedUrls.length} image(s) uploaded`);
    } catch (err: any) {
      showToast(err.message || 'Gallery upload failed', 'error');
    }
  };

  const handleVideoUpload = async (fileList: FileList | null) => {
    if (!requireAuth() || !fileList || fileList.length === 0) return;
    try {
      // Calculate remaining slots (max 2 videos)
      const remainingSlots = 2 - listingForm.videoUrls.length;
      if (remainingSlots <= 0) {
        showToast('Maximum 2 videos allowed', 'info');
        return;
      }
      const uploads = Array.from(fileList).slice(0, remainingSlots);
      const uploadedUrls: string[] = [];
      for (const file of uploads) {
        // eslint-disable-next-line no-await-in-loop
        const url = await uploadVideoAsset(file);
        uploadedUrls.push(url);
      }
      if (!uploadedUrls.length) return;
      setListingForm((prev) => {
        const combined = [...prev.videoUrls, ...uploadedUrls].slice(0, 2);
        return { ...prev, videoUrls: combined };
      });
      showToast(`${uploadedUrls.length} video(s) uploaded`);
    } catch (err: any) {
      showToast(err.message || 'Video upload failed', 'error');
    }
  };

  const handleRemoveVideo = (index: number) => {
    setListingForm((prev) => {
      const nextVideos = prev.videoUrls.filter((_, idx) => idx !== index);
      return { ...prev, videoUrls: nextVideos };
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setListingForm((prev) => {
      const target = prev.galleryImages[index];
      const nextGallery = prev.galleryImages.filter((_, idx) => idx !== index);
      let nextImage = prev.image;
      if (nextImage === target) {
        nextImage = nextGallery[0] || '';
      }
      return { ...prev, galleryImages: nextGallery, image: nextImage };
    });
  };

  const handlePriceAssist = async () => {
    if (!requireAuth()) return;
    if (!listingForm.make || !listingForm.model || !listingForm.year) {
      showToast('Add make, model, and year first', 'info');
      return;
    }
    const payload: PriceEstimatePayload = {
      make: listingForm.make,
      model: listingForm.model,
      year: Number(listingForm.year),
      bodyStyle: listingForm.bodyStyle || undefined,
      horsepower: listingForm.horsepower ? Number(listingForm.horsepower) : undefined,
      currency: listingForm.currency as any,
    };
    try {
      const response = await getPriceEstimate(payload, token);
      if (response.success) {
        setPriceEstimate({
          value: Math.round(response.estimate),
          currency: response.currency,
          range: response.range,
        });
        handleListingInput('price', String(Math.round(response.estimate)));
      } else {
        const errorMessage = (response as { error?: string }).error;
        showToast(errorMessage || 'Unable to generate estimate', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Unable to generate estimate', 'error');
    }
  };

  const handleListingSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAuth()) return;
    
    // Validate required fields
    const errors: string[] = [];
    if (!listingForm.make.trim()) errors.push('Make is required');
    if (!listingForm.model.trim()) errors.push('Model is required');
    if (!listingForm.year.trim()) errors.push('Year is required');
    const yearNum = Number(listingForm.year);
    if (listingForm.year && (yearNum < 1900 || yearNum > new Date().getFullYear() + 2)) {
      errors.push('Year must be between 1900 and ' + (new Date().getFullYear() + 2));
    }
    if (!listingForm.price.trim()) errors.push('Price is required');
    const priceNum = Number(listingForm.price);
    if (listingForm.price && (priceNum < 0 || isNaN(priceNum))) {
      errors.push('Price must be a valid positive number');
    }
    
    if (errors.length > 0) {
      showToast(errors.join('. '), 'error');
      return;
    }
    
    setIsSubmittingListing(true);
    try {
      const cleanedGallery = listingForm.galleryImages.filter((url) => Boolean(url?.trim()));
      const normalizedGallery = cleanedGallery.length ? cleanedGallery : listingForm.image ? [listingForm.image] : [];
      const cleanedVideos = listingForm.videoUrls.filter((url) => Boolean(url?.trim()));
      const mediaGalleryPayload = [
        ...normalizedGallery.map((url) => ({ type: 'image' as const, url })),
        ...cleanedVideos.map((url) => ({ type: 'video' as const, url })),
      ];
      const payload: Partial<Car> = {
        make: listingForm.make,
        model: listingForm.model,
        year: yearNum,
        price: priceNum,
        currency: listingForm.currency as CurrencyCode,
        odometerKm: listingForm.odometer ? Number(listingForm.odometer) : undefined,
        image: listingForm.image || normalizedGallery[0],
        galleryImages: normalizedGallery,
        mediaGallery: mediaGalleryPayload,
        videoUrl: cleanedVideos[0] || undefined,
        description: listingForm.description,
        specs: {
          bodyStyle: listingForm.bodyStyle,
          horsepower: listingForm.horsepower ? Number(listingForm.horsepower) : undefined,
          engine: listingForm.engine,
          fuelEconomy: listingForm.fuelEconomy,
        },
        // New fields
        category: listingForm.category as any || 'car',
        condition: listingForm.condition as any || 'used',
        exteriorColor: listingForm.exteriorColor || undefined,
        interiorColor: listingForm.interiorColor || undefined,
        transmission: listingForm.transmission as any || undefined,
        fuelType: listingForm.fuelType as any || undefined,
        regionalSpec: listingForm.regionalSpec as any || undefined,
        paymentType: listingForm.paymentType as any || 'cash',
        city: listingForm.city || undefined,
        neighborhood: listingForm.neighborhood || undefined,
        trim: listingForm.trim || undefined,
      };
      const response = await createListing(payload, token);
      if (response.success) {
        showToast('Listing created successfully');
        setListingForm({
          make: '',
          model: '',
          year: '',
          price: '',
          currency: listingForm.currency,
          bodyStyle: '',
          horsepower: '',
          engine: '',
          fuelEconomy: '',
          odometer: '',
          image: '',
          galleryImages: [],
          videoUrls: [],
          description: '',
          category: 'car',
          condition: 'used',
          exteriorColor: '',
          interiorColor: '',
          transmission: '',
          fuelType: '',
          regionalSpec: '',
          paymentType: 'cash',
          city: '',
          neighborhood: '',
          trim: '',
        });
        setPriceEstimate(null);
        setVisionSuggestion(null);
        const refresh = await fetchMyListings(token);
        if (refresh.success) setMyListings(refresh.cars || []);
      } else {
        showToast(response.error || 'Could not create listing', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not create listing', 'error');
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const handleDeleteListing = async (carId: number) => {
    if (!requireAuth()) return;
    try {
      await deleteListing(carId, token);
      setMyListings((prev) => prev.filter((car) => car.id !== carId));
      showToast('Listing removed', 'info');
    } catch (err: any) {
      showToast(err.message || 'Unable to delete listing', 'error');
    }
  };

  const handleStartEditListing = (car: Car) => {
    setEditingListing(car);
    // Collect all videos from mediaGallery and videoUrl
    const mediaVideos = car.mediaGallery?.filter(m => m.type === 'video').map(m => m.url) || [];
    const allVideos = car.videoUrl ? [car.videoUrl, ...mediaVideos.filter(v => v !== car.videoUrl)] : mediaVideos;
    // Collect all images from galleryImages and mediaGallery
    const mediaImages = car.mediaGallery?.filter(m => m.type === 'image').map(m => m.url) || [];
    const allImages = [...(car.galleryImages || []), ...mediaImages.filter(img => !(car.galleryImages || []).includes(img))];
    
    setEditForm({
      make: car.make || '',
      model: car.model || '',
      year: car.year?.toString() || '',
      price: car.price?.toString() || '',
      currency: car.currency || 'JOD',
      bodyStyle: car.specs?.bodyStyle || '',
      horsepower: car.specs?.horsepower?.toString() || '',
      engine: car.specs?.engine || '',
      fuelEconomy: car.specs?.fuelEconomy || '',
      odometer: car.odometerKm?.toString() || '',
      image: car.image || '',
      galleryImages: allImages,
      videoUrls: allVideos,
      description: car.description || '',
      category: car.category || 'car',
      condition: car.condition || 'used',
      exteriorColor: car.exteriorColor || '',
      interiorColor: car.interiorColor || '',
      transmission: car.transmission || '',
      fuelType: car.fuelType || '',
      regionalSpec: car.regionalSpec || '',
      paymentType: car.paymentType || 'cash',
      city: car.city || '',
      neighborhood: car.neighborhood || '',
      trim: car.trim || '',
    });
  };

  const handleEditFormInput = (field: keyof ListingFormState, value: string | string[]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditGalleryUpload = async (fileList: FileList | null) => {
    if (!requireAuth() || !fileList || fileList.length === 0) return;
    try {
      const remainingSlots = 12 - editForm.galleryImages.length;
      if (remainingSlots <= 0) {
        showToast('Maximum 12 images allowed', 'info');
        return;
      }
      const uploads = Array.from(fileList).slice(0, remainingSlots);
      const uploadedUrls: string[] = [];
      for (const file of uploads) {
        const url = await uploadImageAsset(file);
        uploadedUrls.push(url);
      }
      if (!uploadedUrls.length) return;
      setEditForm((prev) => {
        const combined = [...prev.galleryImages, ...uploadedUrls].slice(0, 12);
        const primaryImage = prev.image || combined[0] || '';
        return { ...prev, galleryImages: combined, image: primaryImage };
      });
      showToast(`${uploadedUrls.length} image(s) uploaded`);
    } catch (err: any) {
      showToast(err.message || 'Gallery upload failed', 'error');
    }
  };

  const handleEditVideoUpload = async (fileList: FileList | null) => {
    if (!requireAuth() || !fileList || fileList.length === 0) return;
    try {
      const remainingSlots = 2 - editForm.videoUrls.length;
      if (remainingSlots <= 0) {
        showToast('Maximum 2 videos allowed', 'info');
        return;
      }
      const uploads = Array.from(fileList).slice(0, remainingSlots);
      const uploadedUrls: string[] = [];
      for (const file of uploads) {
        const url = await uploadVideoAsset(file);
        uploadedUrls.push(url);
      }
      if (!uploadedUrls.length) return;
      setEditForm((prev) => {
        const combined = [...prev.videoUrls, ...uploadedUrls].slice(0, 2);
        return { ...prev, videoUrls: combined };
      });
      showToast(`${uploadedUrls.length} video(s) uploaded`);
    } catch (err: any) {
      showToast(err.message || 'Video upload failed', 'error');
    }
  };

  const handleRemoveEditGalleryImage = (index: number) => {
    setEditForm((prev) => {
      const target = prev.galleryImages[index];
      const nextGallery = prev.galleryImages.filter((_, idx) => idx !== index);
      let nextImage = prev.image;
      if (nextImage === target) {
        nextImage = nextGallery[0] || '';
      }
      return { ...prev, galleryImages: nextGallery, image: nextImage };
    });
  };

  const handleRemoveEditVideo = (index: number) => {
    setEditForm((prev) => {
      const nextVideos = prev.videoUrls.filter((_, idx) => idx !== index);
      return { ...prev, videoUrls: nextVideos };
    });
  };

  const handleSaveEditListing = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAuth() || !editingListing) return;
    setIsSubmittingListing(true);
    try {
      const cleanedGallery = editForm.galleryImages.filter((url) => Boolean(url?.trim()));
      const normalizedGallery = cleanedGallery.length ? cleanedGallery : editForm.image ? [editForm.image] : [];
      const cleanedVideos = editForm.videoUrls.filter((url) => Boolean(url?.trim()));
      const mediaGalleryPayload = [
        ...normalizedGallery.map((url) => ({ type: 'image' as const, url })),
        ...cleanedVideos.map((url) => ({ type: 'video' as const, url })),
      ];
      const payload: Partial<Car> = {
        make: editForm.make,
        model: editForm.model,
        year: editForm.year ? Number(editForm.year) : undefined,
        price: editForm.price ? Number(editForm.price) : undefined,
        currency: editForm.currency as CurrencyCode,
        odometerKm: editForm.odometer ? Number(editForm.odometer) : undefined,
        image: editForm.image || normalizedGallery[0],
        galleryImages: normalizedGallery,
        mediaGallery: mediaGalleryPayload,
        videoUrl: cleanedVideos[0] || undefined,
        description: editForm.description,
        specs: {
          bodyStyle: editForm.bodyStyle,
          horsepower: editForm.horsepower ? Number(editForm.horsepower) : undefined,
          engine: editForm.engine,
          fuelEconomy: editForm.fuelEconomy,
        },
      };
      const response = await updateListing(editingListing.id, payload, token);
      if (response.success) {
        showToast('Listing updated successfully');
        setEditingListing(null);
        const refresh = await fetchMyListings(token);
        if (refresh.success) setMyListings(refresh.cars || []);
      } else {
        showToast(response.error || 'Could not update listing', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not update listing', 'error');
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const handleSemanticSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireAuth()) return;
    if (!semanticQuery.trim()) {
      setSemanticResults([]);
      return;
    }
    setSemanticLoading(true);
    try {
      const response = await semanticSearch(semanticQuery.trim(), 6, token);
      console.log('Semantic search response:', response);
      if (response.success) {
        const results = response.results?.map((entry) => entry.car) || [];
        console.log('Parsed results:', results);
        setSemanticResults(results);
        if (results.length === 0) {
          showToast('No matching cars found', 'info');
        }
      } else {
        showToast('Search returned no results', 'info');
      }
    } catch (err: any) {
      console.error('Semantic search error:', err);
      showToast(err?.message || 'Semantic search failed', 'error');
    } finally {
      setSemanticLoading(false);
    }
  };

  const handleCreateListingFromChat = async (listingData: any, messageIndex: number) => {
    if (!requireAuth()) return;
    
    try {
        showToast('Processing listing...', 'info');
        
        // Look for image attachment in history
        let imageUrl = '';
        const previousMessages = chatMessages.slice(0, messageIndex + 1).reverse();
        const lastUserMsgWithImage = previousMessages.find(m => m.role === 'user' && m.attachmentUrl);
        
        if (lastUserMsgWithImage && lastUserMsgWithImage.attachmentUrl) {
             try {
                 const response = await fetch(lastUserMsgWithImage.attachmentUrl);
                 const blob = await response.blob();
                 const file = new File([blob], "listing-image.jpg", { type: blob.type });
                 const uploadRes = await uploadListingImage(file, token);
                 if (uploadRes.success) {
                     imageUrl = uploadRes.url;
                 }
             } catch (e) {
                 console.warn("Failed to upload image from chat:", e);
             }
        }
        
        // Validate and sanitize listing data
        const currentYear = new Date().getFullYear();
        let year = Number(listingData.year);
        if (!year || year < 1900 || year > currentYear + 2) {
            year = currentYear; // Default to current year if invalid
        }
        
        let price = Number(listingData.price);
        if (!price || price < 0) {
            price = 0; // Default to 0 if invalid (user can edit later)
        }
        
        const payload: Partial<Car> = {
            make: listingData.make || 'Unknown',
            model: listingData.model || 'Unknown',
            year: year,
            price: price,
            currency: listingData.currency || 'JOD',
            description: listingData.description || '',
            image: imageUrl, 
            specs: listingData.specs || {}
        };
        
        await createListing(payload, token);
        showToast('Listing created successfully!');
        
        // Refresh my listings
        const data = await fetchMyListings(token);
        if (data.success) {
            setMyListings(data.cars);
        }
        setActivePage('myListings');
        
    } catch (error: any) {
        console.error('Failed to create listing from chat', error);
        showToast(error.message || 'Failed to create listing', 'error');
    }
  };

  const handleChatSubmit = async () => {
    if (!requireAuth()) return;
    const message = chatInput.trim();
    if (!message && !chatAttachment) return;
    let sessionId = ensureSession();
    if (!sessionId) {
      sessionId = startNewChat();
    }
    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      role: 'user',
      text: message || '[Attachment] Please analyze the uploaded image.',
      timestamp,
      attachmentUrl: chatAttachment?.preview,
    };
    const updatedMessages = [...chatMessages, userMessage].slice(-CHAT_HISTORY_LIMIT);
    persistChatSession(sessionId, updatedMessages);
    setChatInput('');
    const attachmentData = chatAttachment;
    setChatAttachment(null);
    setChatBusy(true);

    const controller = new AbortController();
    setChatAbortController(controller);

    try {
      const historyPayload: Array<{ role: 'user' | 'bot'; text: string }> = updatedMessages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({ role: msg.role === 'user' ? 'user' : 'bot', text: msg.text }));

      const response = await handleChatbotMessage(
        {
          query: message,
          history: historyPayload,
          imageBase64: attachmentData?.base64,
          imageMimeType: attachmentData?.mime,
        },
        token,
        controller.signal
      );

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.response,
        timestamp: new Date().toISOString(),
        relevantCarIds: (response as any).relevant_car_ids || [],
        listingData: (response as any).listing_data || null,
        actionType: (response as any).action_type || null,
      };

      persistChatSession(sessionId, [...updatedMessages, assistantMessage]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('Response stopped', 'info');
      } else {
        showToast(err.message || 'Assistant failed to respond', 'error');
      }
    } finally {
      setChatBusy(false);
      setChatAbortController(null);
    }
  };

  const handleChatStop = () => {
    if (chatAbortController) {
      chatAbortController.abort();
      setChatAbortController(null);
      setChatBusy(false);
    }
  };

  const renderToast = () => {
    if (!toast) return null;
    const base = toast.type === 'error' ? 'bg-red-500/90' : toast.type === 'info' ? 'bg-blue-500/90' : 'bg-emerald-500/90';
    return (
      <div className={`fixed top-6 right-6 z-50 rounded-xl px-4 py-3 text-white shadow-xl ${base}`}>
        {toast.message}
      </div>
    );
  };

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (filters.make !== 'all' && car.make !== filters.make) return false;
      if (filters.search) {
        const haystack = `${car.make} ${car.model} ${car.year}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [cars, filters]);

  const sortedCars = useMemo(() => {
    const clone = [...filteredCars];
    switch (filters.sort) {
      case 'price-asc':
        return clone.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return clone.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating-desc':
        return clone.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'year-desc':
        return clone.sort((a, b) => (b.year || 0) - (a.year || 0));
      default:
        return clone;
    }
  }, [filteredCars, filters.sort]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(sortedCars.length / LISTINGS_PER_PAGE)), [sortedCars.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.make, filters.search, filters.sort]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * LISTINGS_PER_PAGE;
    return sortedCars.slice(start, start + LISTINGS_PER_PAGE);
  }, [currentPage, sortedCars]);

  const paginationWindow = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const goToPage = useCallback(
    (page: number) => {
      const safePage = Math.min(Math.max(page, 1), totalPages);
      setCurrentPage(safePage);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [totalPages]
  );

  const renderCarCard = (car: Car) => (
    <div
      key={car.id}
      className="flex flex-col rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={getCarImage(car)}
          alt={`${car.make} ${car.model}`}
          loading="lazy"
          onError={(event) => {
            const img = event.currentTarget;
            if (img.src.includes('placeholder-car.png')) return;
            img.src = '/placeholder-car.png';
          }}
          className="h-48 w-full object-cover"
        />
        <button
          onClick={() => toggleFavorite(car)}
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${favorites.includes(car.id) ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-900'
            }`}
        >
          {favorites.includes(car.id) ? copy.listingFavorited : copy.listingFavorite}
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{car.make} {car.model}</h3>
          <p className="text-sm text-slate-500">{car.year || 'Year TBD'}</p>
        </div>
        <div className="text-right text-2xl font-bold text-emerald-600">
          {formatPrice(car.price, car.currency)}
        </div>
      </div>
      {car.specs?.bodyStyle && (
        <p className="text-sm text-slate-600">{car.specs.bodyStyle}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        {car.rating ? <span>⭐ {car.rating.toFixed(1)}</span> : null}
        {car.reviews ? <span>{car.reviews} reviews</span> : null}
        {car.galleryImages?.length ? <span>{car.galleryImages.length} photos</span> : null}
        {car.videoUrl ? <span>🎥 Video</span> : null}
        {car.odometerKm ? <span>{car.odometerKm.toLocaleString()} km</span> : null}
      </div>
      {car.description && (
        <p className="mt-3 line-clamp-3 text-sm text-slate-600">{car.description}</p>
      )}
      <button
        className="mt-4 w-full rounded-xl bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        onClick={() => handleOpenCarDetails(car.id)}
      >
        {copy.listingViewDetails}
      </button>
    </div>
  );

  const renderDealerCard = (dealer: DealerSummary) => (
    <div key={dealer.id} className="flex flex-col rounded-3xl border border-slate-100 bg-white/90 p-4 shadow hover:shadow-lg">
      <div className="h-40 overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={dealer.hero_image || '/placeholder-car.png'}
          alt={dealer.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{dealer.name}</h3>
          <p className="text-sm text-slate-500">{dealer.total_listings} {copy.dealerMetaListings}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>{copy.dealerMetaAverage}</p>
          <p className="text-base font-semibold text-emerald-600">
            {dealer.average_price ? formatPrice(dealer.average_price, 'JOD') : '—'}
          </p>
        </div>
      </div>
      {dealer.top_makes?.length ? (
        <div className="mt-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">{copy.dealerMetaTopMakes}</p>
          <p>{dealer.top_makes.map((entry) => entry.make).slice(0, 3).join(', ')}</p>
        </div>
      ) : null}
      <button
        className="mt-4 w-full rounded-xl bg-slate-900/90 py-2 text-sm font-semibold text-white"
        onClick={() => handleOpenDealer(dealer.id)}
      >
        {copy.dealersVisit}
      </button>
    </div>
  );


  const renderAuthPanel = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">{copy.authSignIn}</h3>
        {authError && (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{authError}</p>
        )}
        <form
          className="mt-4 space-y-4"
          onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const username = String(formData.get('login-username'));
            const password = String(formData.get('login-password'));
            clearError();
            const success = await login(username, password);
            if (success) {
              showToast(`${copy.authWelcomeBack}, ${username}!`);
            } else {
              showToast('Unable to sign in. Please check your details.', 'error');
            }
          }}
        >
          <input name="login-username" placeholder={copy.authUsername} className={`w-full ${inputFieldClass}`} required />
          <input name="login-password" type="password" placeholder={copy.authPassword} className={`w-full ${inputFieldClass}`} required />
          <button className="w-full rounded-2xl bg-sky-600 py-3 font-semibold text-white">{copy.authSignIn}</button>
        </form>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">{copy.authCreateAccount}</h3>
        <form
          className="mt-4 space-y-4"
          onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formElement = event.currentTarget;
            const formData = new FormData(formElement);
            const username = String(formData.get('signup-username'));
            const email = String(formData.get('signup-email'));
            const password = String(formData.get('signup-password'));
            clearError();
            const success = await signup(username, email, password);
            if (success) {
              showToast('Account created! You are now signed in.');
              formElement.reset();
            } else {
              showToast('Unable to sign up. Please try again.', 'error');
            }
          }}
        >
          <input name="signup-username" placeholder={copy.authUsername} className={`w-full ${inputFieldClass}`} required />
          <input name="signup-email" type="email" placeholder={copy.authEmail} className={`w-full ${inputFieldClass}`} required />
          <input name="signup-password" type="password" placeholder={copy.authPassword} className={`w-full ${inputFieldClass}`} required />
          <button className="w-full rounded-2xl bg-emerald-500 py-3 font-semibold text-white">{copy.authSignUp}</button>
        </form>
      </div>
    </div>
  );

  const renderProfilePanel = () => {
    if (!user) {
      return (
        <div className="space-y-6">
          <p className="text-slate-600">{copy.profileSignInPrompt}</p>
          {renderAuthPanel()}
        </div>
      );
    }
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">{copy.profileTitle}</h3>
          <p className="text-slate-600">{copy.authUsername}: {user.username}</p>
          <p className="text-slate-600">{copy.authEmail}: {user.email}</p>
          <button className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900" onClick={() => refreshProfile()}>
            {copy.profileRefresh}
          </button>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">{copy.profileUpdate}</h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formElement = event.currentTarget;
              const formData = new FormData(formElement);
              const username = formData.get('profile-username')?.toString();
              const email = formData.get('profile-email')?.toString();
              const current_password = formData.get('profile-current-password')?.toString();
              const password = formData.get('profile-password')?.toString();
              const result = await updateMyProfile({ username, email, current_password, password });
              if (result) {
                showToast('Profile updated');
                formElement.reset();
              }
            }}
          >
            <input name="profile-username" placeholder={copy.authUsername} defaultValue={user.username} className={`w-full ${inputFieldClass}`} />
            <input name="profile-email" type="email" placeholder={copy.authEmail} defaultValue={user.email} className={`w-full ${inputFieldClass}`} />
            <input name="profile-current-password" type="password" placeholder={copy.authCurrentPassword} className={`w-full ${inputFieldClass}`} />
            <input name="profile-password" type="password" placeholder={copy.authNewPassword} className={`w-full ${inputFieldClass}`} />
            <button className="w-full rounded-2xl bg-emerald-500 py-3 font-semibold text-white">{copy.profileSaveChanges}</button>
          </form>
          <button className="mt-4 w-full rounded-2xl border border-slate-200 py-2 font-semibold text-slate-900" onClick={() => logout()}>
            {copy.authSignOut}
          </button>
        </div>
      </div>
    );
  };

  const renderChatbot = () => (
    <div className="flex h-[calc(100vh-180px)] gap-4">
      {/* Sidebar */}
      <div className="hidden w-72 flex-shrink-0 flex-col rounded-2xl border border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 p-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-blue-600 hover:to-indigo-700"
            onClick={() => startNewChat()}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {copy.chatNewChat}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-slate-400">{copy.chatRecent}</p>
          <div className="space-y-1">
            {chatSessions.map((session) => (
              <div
                key={session.id}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  session.id === activeSessionId
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <button
                  onClick={() => setActiveSessionId(session.id)}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <svg className="h-4 w-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{session.title}</span>
                    <span className="block truncate text-xs text-slate-400">{new Date(session.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChatSession(session.id);
                  }}
                  className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-red-100 hover:text-red-600 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-100 p-4">
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{copy.chatAssistantName}</h2>
              <p className="text-xs text-slate-500">{copy.chatGeneralAssistant}</p>
            </div>
          </div>
          {chatBusy && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{copy.chatThinking}</span>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {chatMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
                <svg className="h-10 w-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">{copy.chatWelcome}</h3>
              <p className="max-w-md text-slate-500">{copy.chatWelcomeDesc}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[copy.chatSuggestion1, copy.chatSuggestion2, copy.chatSuggestion3].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setChatInput(suggestion)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {chatMessages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {msg.role === 'user' ? (
                      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.listingData && (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm shadow-sm">
                        <p className="mb-2 font-semibold text-slate-900">{copy.chatProposedListing}</p>
                        <div className="space-y-1 text-slate-600">
                          {Object.entries(msg.listingData).map(([key, value]) =>
                            value && key !== 'specs' ? (
                              <p key={key}>
                                <span className="font-medium">{camelToTitle(key)}:</span> {String(value)}
                              </p>
                            ) : null
                          )}
                        </div>
                        <button
                          onClick={() => handleCreateListingFromChat(msg.listingData, idx)}
                          className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Create Listing Now
                        </button>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4">
          <div className="mx-auto max-w-3xl">
            {chatAttachment && (
              <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-200">
                    <img src={chatAttachment.preview} alt="Attachment" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-sm text-slate-600">{copy.chatImageAttached}</span>
                </div>
                <button onClick={() => setChatAttachment(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="relative flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
              <label className="flex cursor-pointer items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  name="chat-attachment"
                  id="chat-attachment"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const base64 = await fileToDataUrl(file);
                    setChatAttachment({
                      preview: URL.createObjectURL(file),
                      base64,
                      mime: file.type,
                    });
                  }}
                />
              </label>
              <textarea
                name="chat-input"
                id="chat-input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    if (!chatBusy) handleChatSubmit();
                  }
                }}
                placeholder={copy.chatPlaceholder}
                rows={1}
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              {chatBusy ? (
                <button
                  onClick={handleChatStop}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                  title="Stop generating"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() && !chatAttachment}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  title="Send message"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              {copy.chatSendHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => {
    if (!requireAuth()) return null;
    if (!analyticsData) {
      return <p className="text-slate-500">{copy.analyticsNoData}</p>;
    }
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {['all', 'my', 'favorites'].map((filter) => (
            <button
              key={filter}
              onClick={() => setAnalyticsFilter(filter as 'all' | 'my' | 'favorites')}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${analyticsFilter === filter ? 'bg-sky-600 text-white' : 'border border-slate-200 bg-white text-slate-600'
                }`}
            >
              {camelToTitle(filter)}
            </button>
          ))}
        </div>
        {analyticsData.summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label={copy.analyticsAvgPrice} value={formatPrice(analyticsData.summary.average_price, analyticsData.summary.currency)} />
            <StatCard label={copy.analyticsCheapest} value={formatPrice(analyticsData.summary.min_price, analyticsData.summary.currency)} />
            <StatCard label={copy.analyticsMostExpensive} value={formatPrice(analyticsData.summary.max_price, analyticsData.summary.currency)} />
          </div>
        )}
        {analyticsData.market_top_makes && (
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Top Makes</h3>
            <div className="mt-4 space-y-3">
              {analyticsData.market_top_makes.map((entry) => (
                <div key={entry.make} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{entry.make}</span>
                  <span>{formatPrice(entry.avg_price, analyticsData.summary?.currency)}</span>
                  <span>{entry.listings} listings</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activePage) {
      case 'listings':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <select value={filters.category || 'all'} name="filter-category" id="filter-category" onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value as any }))} className={inputFieldClass}>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select value={filters.make} name="filter-make" id="filter-make" onChange={(event) => setFilters((prev) => ({ ...prev, make: event.target.value }))} className={inputFieldClass}>
                    <option value="all">All Makes</option>
                    {allVehicleMakes.map((make) => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                  <input
                    name="filter-search"
                    id="filter-search"
                    value={filters.search}
                    onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                    placeholder="Search make, model, year"
                    className={inputFieldClass}
                  />
                  <select value={filters.sort} name="filter-sort" id="filter-sort" onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value as CarFilters['sort'] }))} className={inputFieldClass}>
                    <option value="default">Recommended</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                    <option value="year-desc">Newer first</option>
                    <option value="rating-desc">Top rated</option>
                  </select>
                </div>
              </div>
              <form onSubmit={handleSemanticSearch} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">AI Semantic Search</p>
                <div className="mt-3 flex gap-3">
                  <input
                    name="semantic-query"
                    id="semantic-query"
                    value={semanticQuery}
                    onChange={(event) => setSemanticQuery(event.target.value)}
                    placeholder="e.g. Luxury hybrid SUV under 150k"
                    className={`flex-1 ${inputFieldClass}`}
                  />
                  <button type="submit" className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                    {semanticLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {semanticResults.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {semanticResults.map((car) => (
                      <div key={car.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                        <img src={getCarImage(car)} alt={car.model} className="h-14 w-20 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{car.make} {car.model}</span>
                            <button className="text-xs text-sky-600" onClick={() => handleOpenCarDetails(car.id)}>Inspect</button>
                          </div>
                          <p>{formatPrice(car.price, car.currency)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCars.length === 0 ? (
                <p className="col-span-full text-center text-slate-500">No listings match your filters yet.</p>
              ) : (
                paginatedCars.map((car) => renderCarCard(car))
              )}
            </div>
            {sortedCars.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <p>
                  Showing {Math.min((currentPage - 1) * LISTINGS_PER_PAGE + 1, sortedCars.length)}-
                  {Math.min(currentPage * LISTINGS_PER_PAGE, sortedCars.length)} of {sortedCars.length} listings
                </p>
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-2xl border border-slate-200 px-3 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Prev
                    </button>
                    {paginationWindow[0] > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => goToPage(1)}
                          className="rounded-2xl border border-slate-200 px-3 py-1 font-semibold text-slate-700"
                        >
                          1
                        </button>
                        {paginationWindow[0] > 2 && <span className="text-slate-400">…</span>}
                      </>
                    )}
                    {paginationWindow.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`rounded-2xl px-3 py-1 font-semibold ${currentPage === page ? 'bg-sky-600 text-white' : 'border border-slate-200 text-slate-700'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    {paginationWindow[paginationWindow.length - 1] < totalPages && (
                      <>
                        {paginationWindow[paginationWindow.length - 1] < totalPages - 1 && (
                          <span className="text-slate-400">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => goToPage(totalPages)}
                          className="rounded-2xl border border-slate-200 px-3 py-1 font-semibold text-slate-700"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="rounded-2xl border border-slate-200 px-3 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'favorites':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favoriteCars.map((car) => renderCarCard(car))}
            {favoriteCars.length === 0 && <p className="text-slate-500">{copy.noFavorites}</p>}
          </div>
        );
      case 'dealers':
        if (!requireAuth()) return null;
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{copy.dealersHeading}</h2>
              <p className="text-sm text-slate-600">{copy.dealersSubheading}</p>
            </div>
            {dealersLoading ? (
              <p className="text-slate-500">Loading dealers...</p>
            ) : dealers.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {dealers.map((dealer) => renderDealerCard(dealer))}
              </div>
            ) : (
              <p className="text-slate-500">{copy.dealersEmpty}</p>
            )}
          </div>
        );
      case 'myListings':
        if (!requireAuth()) return null;
        return (
          <div className="space-y-6">
            {/* Analytics Summary Cards */}
            {myListingsAnalytics && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm">
                  <p className="text-xs uppercase text-emerald-700">Total Listings</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-900">{myListingsAnalytics.total_listings}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-sm">
                  <p className="text-xs uppercase text-blue-700">Total Value</p>
                  <p className="mt-1 text-2xl font-bold text-blue-900">{formatPrice(myListingsAnalytics.total_value, 'JOD')}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm">
                  <p className="text-xs uppercase text-amber-700">Avg Price</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">{formatPrice(myListingsAnalytics.average_price, 'JOD')}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-sm">
                  <p className="text-xs uppercase text-purple-700">Favorites</p>
                  <p className="mt-1 text-3xl font-bold text-purple-900">{myListingsAnalytics.performance.total_favorites}</p>
                  {myListingsAnalytics.performance.avg_rating > 0 && (
                    <p className="text-sm text-purple-700">★ {myListingsAnalytics.performance.avg_rating} avg rating</p>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Charts Row */}
            {myListingsAnalytics && myListingsAnalytics.total_listings > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Listings by Make */}
                {myListingsAnalytics.listings_by_make.length > 0 && (
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold uppercase text-slate-500">Listings by Make</h3>
                    <div className="space-y-2">
                      {myListingsAnalytics.listings_by_make.slice(0, 5).map((item) => (
                        <div key={item.make} className="flex items-center gap-3">
                          <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${(item.count / myListingsAnalytics.total_listings) * 100}%` }}
                            />
                          </div>
                          <span className="min-w-[80px] text-sm text-slate-700">{item.make}</span>
                          <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold uppercase text-slate-500">Price Range</h3>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Lowest</p>
                      <p className="text-xl font-bold text-slate-900">{formatPrice(myListingsAnalytics.price_range.min, 'JOD')}</p>
                    </div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-300 rounded-full" />
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Highest</p>
                      <p className="text-xl font-bold text-slate-900">{formatPrice(myListingsAnalytics.price_range.max, 'JOD')}</p>
                    </div>
                  </div>
                  {myListingsAnalytics.listings_by_body_style.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Body Styles</p>
                      <div className="flex flex-wrap gap-2">
                        {myListingsAnalytics.listings_by_body_style.map((item) => (
                          <span key={item.bodyStyle} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {item.bodyStyle} ({item.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading state for analytics */}
            {myListingsAnalyticsLoading && !myListingsAnalytics && (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center text-slate-500">
                Loading your listings analytics...
              </div>
            )}

            {/* Listings Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Your Listings ({myListings.length})</h2>
              <button
                onClick={() => setActivePage('addListing')}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                + Add New
              </button>
            </div>

            {/* Listings Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myListings.map((car) => (
                <div key={car.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <img src={getCarImage(car)} alt={car.model} className="h-24 w-32 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{car.make} {car.model}</h3>
                      <p className="text-sm text-slate-500">{car.year}</p>
                      <p className="text-xl font-bold text-emerald-600">{formatPrice(car.price, car.currency)}</p>
                      {car.odometerKm ? (
                        <p className="text-xs text-slate-500">{car.odometerKm.toLocaleString()} km</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-2xl bg-slate-900/5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-900/10" onClick={() => handleOpenCarDetails(car.id)}>
                      View
                    </button>
                    <button className="flex-1 rounded-2xl bg-sky-500 py-2 text-sm font-semibold text-white hover:bg-sky-600" onClick={() => handleStartEditListing(car)}>
                      Edit
                    </button>
                    <button className="flex-1 rounded-2xl bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-600" onClick={() => handleDeleteListing(car.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Listing Modal */}
            {editingListing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
                  <button
                    onClick={() => setEditingListing(null)}
                    className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  >
                    ✕
                  </button>
                  <h2 className="mb-6 text-xl font-bold text-slate-900">Edit Listing</h2>
                  <form onSubmit={handleSaveEditListing} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Make</label>
                        <input
                          type="text"
                          value={editForm.make}
                          onChange={(e) => handleEditFormInput('make', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Model</label>
                        <input
                          type="text"
                          value={editForm.model}
                          onChange={(e) => handleEditFormInput('model', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Year</label>
                        <input
                          type="number"
                          value={editForm.year}
                          onChange={(e) => handleEditFormInput('year', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Price</label>
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => handleEditFormInput('price', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Body Style</label>
                        <input
                          type="text"
                          value={editForm.bodyStyle}
                          onChange={(e) => handleEditFormInput('bodyStyle', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                          placeholder="SUV, Sedan, Coupe..."
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Odometer (km)</label>
                        <input
                          type="number"
                          value={editForm.odometer}
                          onChange={(e) => handleEditFormInput('odometer', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Engine</label>
                        <input
                          type="text"
                          value={editForm.engine}
                          onChange={(e) => handleEditFormInput('engine', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                          placeholder="2.0L Turbo, V8..."
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-slate-500">Horsepower</label>
                        <input
                          type="number"
                          value={editForm.horsepower}
                          onChange={(e) => handleEditFormInput('horsepower', e.target.value)}
                          className={`mt-1 w-full ${inputFieldClass}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-slate-500">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => handleEditFormInput('description', e.target.value)}
                        className={`mt-1 h-24 w-full ${inputFieldClass}`}
                      />
                    </div>

                    {/* Image Gallery */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Images ({editForm.galleryImages.length}/12)</p>
                        </div>
                        <label className="cursor-pointer rounded-2xl bg-slate-900/10 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-900/20">
                          + Add Images
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.gif,.webp"
                            multiple
                            className="hidden"
                            onChange={(e) => handleEditGalleryUpload(e.target.files)}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {editForm.galleryImages.map((url, index) => (
                          <div key={`${url}-${index}`} className="relative">
                            <img src={url} alt={`Gallery ${index + 1}`} className="h-20 w-full rounded-xl object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveEditGalleryImage(index)}
                              className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-xs text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Video Gallery */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Videos ({editForm.videoUrls.length}/2)</p>
                        </div>
                        <label className="cursor-pointer rounded-2xl bg-slate-900/10 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-900/20">
                          + Add Video
                          <input
                            type="file"
                            accept=".mp4,.mov,.avi,.mkv,.webm"
                            className="hidden"
                            onChange={(e) => handleEditVideoUpload(e.target.files)}
                          />
                        </label>
                      </div>
                      {editForm.videoUrls.length > 0 && (
                        <div className="space-y-2">
                          {editForm.videoUrls.map((url, index) => (
                            <div key={`video-${index}`} className="flex items-center gap-2 rounded-xl bg-white p-2">
                              <span className="flex-1 truncate text-sm text-slate-600">🎥 Video {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveEditVideo(index)}
                                className="rounded-full bg-rose-500 px-2 py-1 text-xs text-white"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setEditingListing(null)}
                        className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingListing}
                        className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isSubmittingListing ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {myListings.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-slate-500 mb-4">No personal listings yet.</p>
                <button
                  onClick={() => setActivePage('addListing')}
                  className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Create Your First Listing
                </button>
              </div>
            )}
          </div>
        );
      case 'addListing':
        if (!requireAuth()) return null;
        return (
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <form className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm" onSubmit={handleListingSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  name="listing-make"
                  id="listing-make"
                  value={listingForm.make}
                  onChange={(event) => handleMakeSelect(event.target.value)}
                  className={inputFieldClass}
                  required
                >
                  <option value="">{copy.makeSelectLabel}</option>
                  {availableMakeOptions.map((makeOption) => (
                    <option key={makeOption} value={makeOption}>{makeOption}</option>
                  ))}
                </select>
                <select
                  name="listing-model"
                  id="listing-model"
                  value={listingForm.model}
                  onChange={(event) => handleModelSelect(event.target.value)}
                  className={inputFieldClass}
                  required
                  disabled={!listingForm.make}
                >
                  <option value="">{copy.modelSelectLabel}</option>
                  {availableModelOptions.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <input name="listing-year" id="listing-year" value={listingForm.year} onChange={(event) => handleListingInput('year', event.target.value)} placeholder="Year" className={inputFieldClass} required />
                <input name="listing-price" id="listing-price" value={listingForm.price} onChange={(event) => handleListingInput('price', event.target.value)} placeholder="Price" className={inputFieldClass} required />
                <select name="listing-currency" id="listing-currency" value={listingForm.currency} onChange={(event) => handleListingInput('currency', event.target.value)} className={inputFieldClass}>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <input name="listing-bodystyle" id="listing-bodystyle" value={listingForm.bodyStyle} onChange={(event) => handleListingInput('bodyStyle', event.target.value)} placeholder="Body style" className={inputFieldClass} />
                <input name="listing-horsepower" id="listing-horsepower" value={listingForm.horsepower} onChange={(event) => handleListingInput('horsepower', event.target.value)} placeholder="Horsepower" className={inputFieldClass} />
                {availableEngineOptions.length > 0 ? (
                  <select
                    name="listing-engine"
                    id="listing-engine"
                    value={listingForm.engine}
                    onChange={(event) => handleListingInput('engine', event.target.value)}
                    className={inputFieldClass}
                    disabled={!listingForm.model}
                  >
                    <option value="">{copy.engineSelectLabel}</option>
                    {availableEngineOptions.map((engine) => (
                      <option key={engine} value={engine}>{engine}</option>
                    ))}
                  </select>
                ) : (
                  <input name="listing-engine" id="listing-engine" value={listingForm.engine} onChange={(event) => handleListingInput('engine', event.target.value)} placeholder={copy.engineSelectLabel} className={inputFieldClass} />
                )}
                <input name="listing-fueleconomy" id="listing-fueleconomy" value={listingForm.fuelEconomy} onChange={(event) => handleListingInput('fuelEconomy', event.target.value)} placeholder="Fuel economy" className={inputFieldClass} />
                <input
                  name="listing-odometer"
                  id="listing-odometer"
                  value={listingForm.odometer}
                  onChange={(event) => handleListingInput('odometer', event.target.value)}
                  placeholder={copy.odometerLabel}
                  className={inputFieldClass}
                  type="number"
                  min="0"
                />
                <input name="listing-image" id="listing-image" value={listingForm.image} onChange={(event) => handleListingInput('image', event.target.value)} placeholder="Image URL" className={inputFieldClass} />
              </div>
              
              {/* Additional Vehicle Details */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">Additional Details (Optional)</p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <select name="listing-category" value={listingForm.category} onChange={(e) => handleListingInput('category', e.target.value)} className={inputFieldClass}>
                    {CATEGORY_OPTIONS.filter(c => c.value !== 'all').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select name="listing-condition" value={listingForm.condition} onChange={(e) => handleListingInput('condition', e.target.value)} className={inputFieldClass}>
                    {CONDITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select name="listing-transmission" value={listingForm.transmission} onChange={(e) => handleListingInput('transmission', e.target.value)} className={inputFieldClass}>
                    {TRANSMISSION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select name="listing-fueltype" value={listingForm.fuelType} onChange={(e) => handleListingInput('fuelType', e.target.value)} className={inputFieldClass}>
                    {FUEL_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select name="listing-regionalspec" value={listingForm.regionalSpec} onChange={(e) => handleListingInput('regionalSpec', e.target.value)} className={inputFieldClass}>
                    {REGIONAL_SPEC_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select name="listing-paymenttype" value={listingForm.paymentType} onChange={(e) => handleListingInput('paymentType', e.target.value)} className={inputFieldClass}>
                    {PAYMENT_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input name="listing-trim" value={listingForm.trim} onChange={(e) => handleListingInput('trim', e.target.value)} placeholder="Trim (SE, Sport, etc.)" className={inputFieldClass} />
                  <input name="listing-exteriorcolor" value={listingForm.exteriorColor} onChange={(e) => handleListingInput('exteriorColor', e.target.value)} placeholder="Exterior Color" className={inputFieldClass} />
                  <input name="listing-interiorcolor" value={listingForm.interiorColor} onChange={(e) => handleListingInput('interiorColor', e.target.value)} placeholder="Interior Color" className={inputFieldClass} />
                  <input name="listing-city" value={listingForm.city} onChange={(e) => handleListingInput('city', e.target.value)} placeholder="City" className={inputFieldClass} />
                  <input name="listing-neighborhood" value={listingForm.neighborhood} onChange={(e) => handleListingInput('neighborhood', e.target.value)} placeholder="Neighborhood" className={inputFieldClass} />
                </div>
              </div>
              
              <textarea name="listing-description" id="listing-description" value={listingForm.description} onChange={(event) => handleListingInput('description', event.target.value)} placeholder="Description" className={`h-32 w-full ${inputFieldClass}`}
              />
              <div className="flex flex-wrap gap-3">
                <button type="button" className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white" onClick={handlePriceAssist}>
                  {copy.priceAssistLabel}
                </button>
                <label htmlFor="upload-photo-input" className="cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900">
                  {copy.uploadPhotoLabel}
                  <input type="file" name="upload-photo" id="upload-photo-input" accept="image/*" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleUploadImage(file);
                  }} />
                </label>
                <label htmlFor="vision-helper-input" className="cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900">
                  {copy.visionHelperLabel}
                  <input type="file" name="vision-helper" id="vision-helper-input" accept="image/*" className="hidden" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleVisionAnalyze(file);
                  }} />
                </label>
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{copy.galleryLabel}</p>
                    <p className="text-xs text-slate-500">Upload up to 12 images (PNG, JPG, JPEG, GIF, WEBP)</p>
                  </div>
                  <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">
                    📷 {copy.galleryUploadLabel} ({listingForm.galleryImages.length}/12)
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.gif,.webp"
                      name="gallery-upload"
                      id="gallery-upload"
                      multiple
                      className="hidden"
                      onChange={(event) => handleGalleryUpload(event.target.files)}
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {listingForm.galleryImages.length === 0 && (
                    <p className="text-sm text-slate-500 sm:col-span-3 md:col-span-4">{copy.galleryEmpty}</p>
                  )}
                  {listingForm.galleryImages.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img src={url} alt={`Gallery ${index + 1}`} className="h-32 w-full object-cover" />
                      <button type="button" className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-100" onClick={() => handleRemoveGalleryImage(index)}>
                        ✕
                      </button>
                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white">Main</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Video Upload Section */}
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{copy.videoLabel}</p>
                      <p className="text-xs text-slate-500">Upload up to 2 videos (MP4, MOV, AVI, MKV, WEBM - Max 100MB each)</p>
                    </div>
                    <label className="cursor-pointer rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100">
                      🎥 Upload Video ({listingForm.videoUrls.length}/2)
                      <input
                        type="file"
                        accept=".mp4,.mov,.avi,.mkv,.webm"
                        name="video-upload"
                        id="video-upload"
                        multiple
                        className="hidden"
                        onChange={(event) => handleVideoUpload(event.target.files)}
                      />
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {listingForm.videoUrls.length === 0 && (
                      <p className="text-sm text-slate-500 sm:col-span-2">No videos uploaded yet</p>
                    )}
                    {listingForm.videoUrls.map((url, index) => (
                      <div key={`video-${url}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <video src={url} className="h-32 w-full object-cover" controls />
                        <button type="button" className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-100" onClick={() => handleRemoveVideo(index)}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {priceEstimate && (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  Suggested price {formatPrice(priceEstimate.value, priceEstimate.currency)}
                  {priceEstimate.range && (
                    <p className="text-emerald-700">
                      Range {formatPrice(priceEstimate.range.low, priceEstimate.currency)} → {formatPrice(priceEstimate.range.high, priceEstimate.currency)}
                    </p>
                  )}
                </div>
              )}
              {visionSuggestion && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Vision insights</p>
                  {visionSuggestion.highlights?.map((highlight, index) => (
                    <p key={index}>• {highlight}</p>
                  ))}
                </div>
              )}
              <button className="w-full rounded-2xl bg-emerald-600 py-3 text-lg font-semibold text-white" disabled={isSubmittingListing}>
                {isSubmittingListing ? 'Publishing...' : 'Publish Listing'}
              </button>
            </form>
            <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Vision Helper Tips</h3>
              <p className="text-sm text-slate-600">Upload clear daylight shots. The AI will detect make, model, color, and condition to pre-fill your listing.</p>
              {visionLoading && <p className="text-slate-500">Analyzing image...</p>}
            </div>
          </div>
        );
      case 'profile':
        return renderProfilePanel();
      case 'chatbot':
        return renderChatbot();

      case 'analytics':
        return renderAnalytics();
      default:
        return null;
    }
  };

  const currentServiceLabel = copy[currentService.labelKey];
  const currentServiceDescription = copy[currentService.descriptionKey];
  const currentYear = new Date().getFullYear();

  return (
    <div className={`${backgroundClass} min-h-screen relative`} dir={direction} style={backgroundImageStyle}>
      {/* Overlay for readability */}
      <div className={`absolute inset-0 ${resolvedTheme === 'dark' ? 'bg-slate-950/85' : 'bg-white/80'}`} />
      <div className="relative z-10">
      {renderToast()}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${headerSurfaceClass} ${subtleBorderClass}`}>
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div
              className="group flex cursor-pointer items-center gap-3 h-20"
              onClick={() => setActivePage('listings')}
            >
              <img
                src="/Intelli_Wheels.png"
                alt="IntelliWheels"
                className="h-20 w-auto object-contain object-center transition-transform group-hover:scale-105 drop-shadow-lg"
              />
            </div>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { key: 'listings', label: copy.navCatalog },
                { key: 'dealers', label: copy.navDealers },
                { key: 'favorites', label: copy.navFavorites },
                { key: 'addListing', label: copy.navAddListing },
                { key: 'chatbot', label: copy.navChatbot },
                { key: 'myListings', label: copy.navMyListings },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActivePage(item.key as PageKey)}
                  className={`rounded-xl px-4 py-2 text-xl font-semibold transition-all ${activePage === item.key
                    ? 'bg-slate-100/10 text-indigo-500 shadow-sm ring-1 ring-inset ring-slate-200/10 dark:text-indigo-400'
                    : `text-slate-500 hover:bg-slate-100/5 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200`
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className={`hidden h-8 w-px md:block ${resolvedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />

            <div className="flex items-center gap-2">
              {/* Search Trigger */}
              <div className="relative hidden sm:block" ref={headerSearchRef as any}>
                {headerSearchOpen ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (headerSearchQuery.trim()) {
                        setFilters((prev) => ({ ...prev, search: headerSearchQuery.trim() }));
                        setActivePage('listings');
                        setHeaderSearchOpen(false);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={headerSearchQuery}
                      onChange={(e) => setHeaderSearchQuery(e.target.value)}
                      placeholder={copy.searchPlaceholder || 'Search cars...'}
                      autoFocus
                      className={`w-48 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${resolvedTheme === 'dark' ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
                    />
                    <button type="submit" className="rounded-full bg-indigo-500 p-2 text-white hover:bg-indigo-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => { setHeaderSearchOpen(false); setHeaderSearchQuery(''); }} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setHeaderSearchOpen(true)}
                    className={`rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Settings Toggle */}
              <div className="relative" ref={settingsMenuRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`flex items-center gap-2 rounded-full border p-1 pr-4 transition-all hover:shadow-md ${statusPillClass}`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                    {mounted && user?.username?.[0]?.toUpperCase() || 'G'}
                  </div>
                  <span className="text-xs font-bold">{mounted && user ? user.username : copy.statusGuest}</span>
                  <span className="text-xs opacity-50">▼</span>
                </button>

                {settingsOpen && (
                  <div className={`absolute right-0 top-full mt-4 w-72 origin-top-right overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900`}>
                    <div className="bg-slate-50 px-6 py-4 dark:bg-slate-800/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{copy.settingsTitle}</p>
                      <p className="text-sm text-slate-400">{copy.settingsSubtitle}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => { setActivePage('profile'); setSettingsOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xl dark:bg-indigo-900/30">👤</span>
                        <div>
                          <p className={`font-semibold text-sm ${resolvedTheme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{mounted && user ? copy.settingsProfileCta : copy.settingsProfileGuest}</p>
                          <p className="text-xs text-slate-500">{mounted && user?.email ? user.email : 'Manage account'}</p>
                        </div>
                      </button>
                      <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="space-y-4 px-3 py-2">
                        {/* Language Selector */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">{copy.settingsLanguage}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {LANGUAGE_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setLanguage(opt.value)}
                                className={`rounded-lg py-1.5 text-xs font-semibold transition ${language === opt.value
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Currency Selector */}
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-500">{copy.settingsCurrency}</label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                            className="w-full appearance-none rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {CURRENCY_OPTIONS.map((code) => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                        </div>

                        {/* Theme Selector */}
                        <div>
                          <p className="mb-1 text-xs font-bold text-slate-500">{copy.themeLabel}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {THEME_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setTheme(opt.value)}
                                className={`rounded-lg py-2 text-xs font-semibold transition ${theme === opt.value
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                              >
                                {copy[opt.labelKey]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2">
                          {!user ? (
                            <div className="grid grid-cols-2 gap-2 p-1">
                              <button onClick={() => { setActivePage('profile'); setSettingsOpen(false); }} className="rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Sign In</button>
                              <button onClick={() => { setActivePage('profile'); setSettingsOpen(false); }} className="rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800">Sign Up</button>
                            </div>
                          ) : (
                            <button onClick={() => { logout(); setSettingsOpen(false); }} className="w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-bold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-900/20">Sign Out</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 md:hidden dark:border-slate-700 dark:text-slate-300"
                onClick={() => setNavMenuOpen(!navMenuOpen)}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {navMenuOpen && (
          <div className="border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
            <div className="space-y-1">
              {[
                { key: 'listings', label: copy.navCatalog },
                { key: 'dealers', label: copy.navDealers },
                { key: 'favorites', label: copy.navFavorites },
                { key: 'chatbot', label: copy.navChatbot },
                { key: 'myListings', label: copy.navMyListings },
                { key: 'profile', label: copy.navProfile },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setActivePage(item.key as PageKey); setNavMenuOpen(false); }}
                  className={`block w-full rounded-xl px-4 py-3 text-left font-semibold ${activePage === item.key ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <main className={`rounded-3xl ${mainSurfaceClass} p-6 shadow-lg`}>
          {authLoading ? <p className="text-center text-slate-500">Loading account...</p> : renderContent()}
        </main>
      </div>
      <footer className={`${resolvedTheme === 'dark' ? 'bg-slate-950 text-slate-200' : 'bg-slate-800 text-slate-100'} border-t border-slate-700/50`}>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-wrap items-start justify-between gap-6 text-sm">
            <div>
              <p className="text-lg font-semibold text-white">IntelliWheels</p>
              <p className="text-sm text-slate-300">{copy.tagline}</p>
            </div>
            <div>
              <p className="font-semibold text-white">{copy.footerSupport}</p>
              <p className="text-sm text-slate-300">{copy.footerEmail}: intelliwheels03@gmail.com</p>
              <p className="text-sm text-slate-300">{copy.footerPhone}: +962 77 738 1408</p>
            </div>
            <div>
              <p className="font-semibold text-white">{copy.footerContact}</p>
              <p className="text-sm text-slate-300">Amman, Jordan</p>
              <p className="text-sm text-slate-300">intelliwheels03@gmail.com</p>
            </div>
            <div>
              <p className="font-semibold text-white">{copy.footerSocial}</p>
              <div className="flex flex-col gap-1 text-sky-400">
                <a href="https://www.instagram.com/intelli_wheels1/" target="_blank" rel="noreferrer" className="hover:text-sky-300">{copy.footerInstagram}</a>
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-400">© {currentYear} IntelliWheels. {copy.footerRights}</p>
        </div>
      </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 text-slate-900 shadow-sm">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function camelToTitle(value: string) {
  return value
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
