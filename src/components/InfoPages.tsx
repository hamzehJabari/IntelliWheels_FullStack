'use client';

interface InfoPageProps {
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  onNavigate: (page: string) => void;
}

export function CookiePolicyPage({ theme, language }: InfoPageProps) {
  const isDark = theme === 'dark';
  const isAr = language === 'ar';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';

  return (
    <div className="mx-auto max-w-4xl space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className={`text-3xl font-bold md:text-4xl ${heading}`}>
          {isAr ? 'سياسة ملفات تعريف الارتباط' : 'Cookie Policy'}
        </h1>
        <p className={`mt-2 ${body}`}>
          {isAr ? 'آخر تحديث: فبراير 2026' : 'Last updated: February 2026'}
        </p>
      </div>

      <div className={`rounded-2xl border p-6 md:p-8 space-y-6 ${card}`}>
        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'ما هي ملفات تعريف الارتباط؟' : 'What Are Cookies?'}
          </h2>
          <p className={body}>
            {isAr
              ? 'ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة موقعنا. تساعدنا في تقديم تجربة أفضل لك.'
              : 'Cookies are small text files stored on your device when you visit our website. They help us provide a better experience for you.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'كيف نستخدم ملفات تعريف الارتباط' : 'How We Use Cookies'}
          </h2>
          <div className="space-y-4">
            {[
              {
                title: isAr ? 'ملفات ضرورية' : 'Essential Cookies',
                desc: isAr ? 'مطلوبة لتشغيل الموقع بشكل صحيح، مثل تسجيل الدخول وتفضيلات اللغة.' : 'Required for the website to function properly, such as login sessions and language preferences.',
                examples: isAr ? 'رمز المصادقة، اللغة المفضلة، العملة، الوضع المظهري' : 'Authentication token, preferred language, currency, theme mode',
              },
              {
                title: isAr ? 'ملفات الأداء' : 'Performance Cookies',
                desc: isAr ? 'تساعدنا في فهم كيفية تفاعل الزوار مع الموقع لتحسين الأداء.' : 'Help us understand how visitors interact with the site to improve performance.',
                examples: isAr ? 'Google Analytics (مجهول الهوية)' : 'Google Analytics (anonymized)',
              },
              {
                title: isAr ? 'ملفات الوظائف' : 'Functionality Cookies',
                desc: isAr ? 'تذكر اختياراتك لتقديم تجربة مخصصة.' : 'Remember your choices to provide a personalized experience.',
                examples: isAr ? 'جلسات الدردشة، المفضلة، وضع مساحة العمل' : 'Chat sessions, favorites, workspace mode',
              },
            ].map((cookie, i) => (
              <div key={i} className={`rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <h3 className={`font-semibold ${heading}`}>{cookie.title}</h3>
                <p className={`mt-1 text-sm ${body}`}>{cookie.desc}</p>
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isAr ? 'أمثلة: ' : 'Examples: '}{cookie.examples}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'إدارة ملفات تعريف الارتباط' : 'Managing Cookies'}
          </h2>
          <p className={body}>
            {isAr
              ? 'يمكنك التحكم في ملفات تعريف الارتباط وحذفها من خلال إعدادات المتصفح الخاص بك. يرجى ملاحظة أن تعطيل بعض ملفات تعريف الارتباط قد يؤثر على وظائف الموقع.'
              : 'You can control and delete cookies through your browser settings. Please note that disabling certain cookies may affect website functionality.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </h2>
          <p className={body}>
            {isAr
              ? 'إذا كان لديك أي أسئلة حول سياسة ملفات تعريف الارتباط، يرجى التواصل معنا على intelliwheels03@gmail.com'
              : 'If you have questions about our Cookie Policy, please contact us at intelliwheels03@gmail.com'}
          </p>
        </section>
      </div>
    </div>
  );
}

export function DisclaimerPage({ theme, language }: InfoPageProps) {
  const isDark = theme === 'dark';
  const isAr = language === 'ar';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';

  return (
    <div className="mx-auto max-w-4xl space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className={`text-3xl font-bold md:text-4xl ${heading}`}>
          {isAr ? 'إخلاء المسؤولية' : 'Disclaimer'}
        </h1>
        <p className={`mt-2 ${body}`}>
          {isAr ? 'آخر تحديث: فبراير 2026' : 'Last updated: February 2026'}
        </p>
      </div>

      <div className={`rounded-2xl border p-6 md:p-8 space-y-6 ${card}`}>
        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'تنبيه عام' : 'General Notice'}
          </h2>
          <p className={body}>
            {isAr
              ? 'المعلومات المقدمة على منصة IntelliWheels هي لأغراض إعلامية فقط. نحن لا نضمن دقة أو اكتمال أي معلومات على الموقع.'
              : 'The information provided on the IntelliWheels platform is for informational purposes only. We do not guarantee the accuracy or completeness of any information on the site.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'تقديرات الأسعار بالذكاء الاصطناعي' : 'AI Price Estimates'}
          </h2>
          <div className={`rounded-xl p-4 border-l-4 border-amber-500 ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
            <p className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
              {isAr ? '⚠️ تنبيه مهم' : '⚠️ Important Notice'}
            </p>
            <p className={`mt-2 text-sm ${isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>
              {isAr
                ? 'تقديرات الأسعار المقدمة من الذكاء الاصطناعي هي تقريبية فقط وتعتمد على نماذج التعلم الآلي. لا ينبغي اعتبارها تقييمات رسمية أو مهنية. يُنصح دائماً بإجراء فحص مستقل قبل اتخاذ قرارات الشراء.'
                : 'AI-generated price estimates are approximate only and are based on machine learning models. They should not be considered official or professional appraisals. We always recommend conducting independent inspections before making purchase decisions.'}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'تحليل الصور بالذكاء الاصطناعي' : 'AI Vision Analysis'}
          </h2>
          <p className={body}>
            {isAr
              ? 'نتائج تحليل صور السيارات بالذكاء الاصطناعي (تحديد الشركة والموديل والمواصفات) هي تقديرية وقد لا تكون دقيقة بنسبة 100%. يجب التحقق من المعلومات يدوياً.'
              : 'AI-powered car image analysis results (make, model, and specifications identification) are estimates and may not be 100% accurate. Information should be verified manually.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'إعلانات الطرف الثالث' : 'Third-Party Listings'}
          </h2>
          <p className={body}>
            {isAr
              ? 'لا تتحمل IntelliWheels مسؤولية دقة أو صحة الإعلانات المنشورة من قبل المستخدمين أو الوكلاء. نوصي دائماً بالتحقق من معلومات السيارة شخصياً قبل الشراء.'
              : 'IntelliWheels is not responsible for the accuracy or validity of listings posted by users or dealers. We always recommend verifying vehicle information in person before purchasing.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className={`text-xl font-semibold ${heading}`}>
            {isAr ? 'حدود المسؤولية' : 'Limitation of Liability'}
          </h2>
          <p className={body}>
            {isAr
              ? 'لا تتحمل IntelliWheels أو مؤسسوها أو موظفوها أي مسؤولية عن أي خسائر مباشرة أو غير مباشرة ناتجة عن استخدام المنصة أو الاعتماد على المعلومات المقدمة فيها.'
              : 'IntelliWheels, its founders, and its employees shall not be held liable for any direct or indirect losses resulting from the use of the platform or reliance on information provided therein.'}
          </p>
        </section>
      </div>
    </div>
  );
}

export function FAQPage({ theme, language, onNavigate }: InfoPageProps) {
  const isDark = theme === 'dark';
  const isAr = language === 'ar';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';

  const faqs = isAr
    ? [
        { q: 'هل IntelliWheels مجاني للاستخدام؟', a: 'نعم! التصفح والبحث وإضافة الإعلانات والتواصل مع البائعين كلها مجانية تماماً. نقدم أيضاً خطط اشتراك للوكلاء مع ميزات متقدمة.' },
        { q: 'كيف يعمل البحث بالذكاء الاصطناعي؟', a: 'يمكنك وصف السيارة التي تبحث عنها بكلماتك الخاصة (مثل "سيارة هجينة فاخرة أقل من 50 ألف") وسيقوم الذكاء الاصطناعي بإيجاد أفضل النتائج المطابقة.' },
        { q: 'هل تقديرات الأسعار دقيقة؟', a: 'تعتمد تقديراتنا على نماذج التعلم الآلي وبيانات السوق. هي تقريبية وليست تقييمات مهنية رسمية. ننصح دائماً بالفحص الشخصي.' },
        { q: 'كيف أصبح وكيلاً معتمداً؟', a: 'يمكنك التقدم بطلب من خلال صفحة "الوكلاء" وملء نموذج الطلب. سيقوم فريقنا بمراجعة طلبك والرد عليك خلال 48 ساعة.' },
        { q: 'ما هي العملات المدعومة؟', a: 'ندعم الدينار الأردني، الدولار، اليورو، الريال السعودي، الدرهم الإماراتي، الدينار الكويتي، وعملات أخرى مع تحويل فوري.' },
        { q: 'هل يمكنني تحميل صورة سيارة للتعرف عليها؟', a: 'نعم! ميزة مساعد الرؤية تتيح لك تحميل صورة سيارة وسيقوم الذكاء الاصطناعي بتحديد الشركة والموديل والسنة والمواصفات تلقائياً.' },
        { q: 'هل الموقع آمن؟', a: 'نعم. نستخدم تشفير SSL/HTTPS، وحماية ضد الهجمات الشائعة، وجميع البيانات مخزنة بشكل آمن. لا نشارك بياناتك مع أطراف ثالثة بدون إذنك.' },
        { q: 'كيف أتواصل مع الدعم؟', a: 'يمكنك التواصل معنا عبر البريد الإلكتروني intelliwheels03@gmail.com أو واتساب +962 77 738 1408.' },
      ]
    : [
        { q: 'Is IntelliWheels free to use?', a: 'Yes! Browsing, searching, listing cars, and contacting sellers are all completely free. We also offer subscription plans for dealers with advanced features.' },
        { q: 'How does the AI search work?', a: 'You can describe the car you\'re looking for in your own words (e.g., "luxury hybrid SUV under 50k") and our AI will find the best matching results using semantic search.' },
        { q: 'Are the price estimates accurate?', a: 'Our estimates are based on machine learning models and market data. They are approximate and not official professional appraisals. We always recommend in-person inspection.' },
        { q: 'How do I become a verified dealer?', a: 'You can apply through the "Dealers" page and fill out the application form. Our team will review your application and respond within 48 hours.' },
        { q: 'What currencies are supported?', a: 'We support JOD, USD, EUR, SAR, AED, KWD, and more with real-time conversion rates.' },
        { q: 'Can I upload a car photo for identification?', a: 'Yes! The Vision Helper feature lets you upload a car photo and our AI will automatically identify the make, model, year, and specifications.' },
        { q: 'Is the website secure?', a: 'Yes. We use SSL/HTTPS encryption, protection against common attacks, and all data is stored securely. We never share your data with third parties without your consent.' },
        { q: 'How do I contact support?', a: 'You can reach us via email at intelliwheels03@gmail.com or WhatsApp at +962 77 738 1408.' },
      ];

  return (
    <div className="mx-auto max-w-4xl space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className={`text-3xl font-bold md:text-4xl ${heading}`}>
          {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h1>
        <p className={`mt-2 ${body}`}>
          {isAr ? 'إجابات على أكثر الأسئلة شيوعاً' : 'Answers to the most common questions'}
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className={`group rounded-2xl border ${card} overflow-hidden`}
          >
            <summary className={`cursor-pointer list-none px-6 py-5 font-semibold ${heading} flex items-center justify-between`}>
              <span>{faq.q}</span>
              <svg className="h-5 w-5 flex-shrink-0 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className={`px-6 pb-5 ${body}`}>
              <p>{faq.a}</p>
            </div>
          </details>
        ))}
      </div>

      <div className={`rounded-2xl border p-6 text-center ${card}`}>
        <p className={`font-semibold ${heading}`}>
          {isAr ? 'لم تجد إجابتك؟' : 'Didn\'t find your answer?'}
        </p>
        <p className={`mt-1 text-sm ${body}`}>
          {isAr ? 'تواصل معنا مباشرة أو استخدم المساعد الذكي' : 'Contact us directly or use our AI Assistant'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('chatbot')}
            className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            {isAr ? '🤖 المساعد الذكي' : '🤖 AI Assistant'}
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className={`rounded-xl border px-6 py-2.5 text-sm font-semibold ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            {isAr ? '📧 تواصل معنا' : '📧 Contact Us'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AboutPage({ theme, language }: InfoPageProps) {
  const isDark = theme === 'dark';
  const isAr = language === 'ar';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';

  return (
    <div className="mx-auto max-w-4xl space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800'}`} />
        <div className="relative px-8 py-16 text-center">
          <h1 className="text-3xl font-bold text-white md:text-5xl">
            {isAr ? 'من نحن' : 'About IntelliWheels'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            {isAr
              ? 'نبني أذكى سوق سيارات في الأردن ومنطقة الخليج باستخدام الذكاء الاصطناعي'
              : 'Building the smartest automotive marketplace in Jordan and the GCC with AI'}
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className={`rounded-2xl border p-6 ${card}`}>
          <div className="text-3xl">🎯</div>
          <h2 className={`mt-3 text-xl font-semibold ${heading}`}>
            {isAr ? 'مهمتنا' : 'Our Mission'}
          </h2>
          <p className={`mt-2 ${body}`}>
            {isAr
              ? 'جعل عملية شراء وبيع السيارات أكثر شفافية وذكاءً وسهولة من خلال تقنيات الذكاء الاصطناعي المتقدمة.'
              : 'To make buying and selling cars more transparent, intelligent, and effortless through advanced AI technology.'}
          </p>
        </div>
        <div className={`rounded-2xl border p-6 ${card}`}>
          <div className="text-3xl">🔮</div>
          <h2 className={`mt-3 text-xl font-semibold ${heading}`}>
            {isAr ? 'رؤيتنا' : 'Our Vision'}
          </h2>
          <p className={`mt-2 ${body}`}>
            {isAr
              ? 'أن نصبح المنصة الرائدة لتداول السيارات في منطقة الشرق الأوسط، مدعومة بأحدث تقنيات الذكاء الاصطناعي.'
              : 'To become the leading automotive trading platform in the Middle East, powered by cutting-edge AI technology.'}
          </p>
        </div>
      </div>

      {/* Story */}
      <div className={`rounded-2xl border p-6 md:p-8 ${card}`}>
        <h2 className={`text-2xl font-bold ${heading}`}>
          {isAr ? 'قصتنا' : 'Our Story'}
        </h2>
        <div className={`mt-4 space-y-4 ${body}`}>
          <p>
            {isAr
              ? 'بدأت IntelliWheels كمشروع تخرج في جامعة بيرزيت، حيث رأينا فجوة كبيرة في سوق السيارات الأردني: غياب الشفافية في التسعير، صعوبة البحث عن السيارة المناسبة، وانعدام الأدوات الذكية لمساعدة المشترين والبائعين.'
              : 'IntelliWheels started as a capstone project at Birzeit University, where we identified a significant gap in the Jordanian car market: lack of pricing transparency, difficulty finding the right car, and absence of intelligent tools to assist buyers and sellers.'}
          </p>
          <p>
            {isAr
              ? 'حصلنا على تقدير امتياز (Distinction) وجاءت التوصية من لجنة التقييم: "نريد أن نراها كشركة ناشئة الآن!" - وهذا ما نعمل عليه.'
              : 'We earned a Distinction grade, and the evaluation committee\'s response was: "We want to see it as a startup NOW!" — and that\'s exactly what we\'re working on.'}
          </p>
        </div>
      </div>

      {/* What Sets Us Apart */}
      <div className={`rounded-2xl border p-6 md:p-8 ${card}`}>
        <h2 className={`text-2xl font-bold ${heading}`}>
          {isAr ? 'ما يميزنا' : 'What Sets Us Apart'}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(isAr
            ? [
                { icon: '🤖', title: 'ذكاء اصطناعي متقدم', desc: 'بحث دلالي، تحليل صور، تقدير أسعار بتقنية Gemini AI' },
                { icon: '🌐', title: 'ثنائي اللغة بالكامل', desc: 'دعم كامل للعربية والإنجليزية مع RTL' },
                { icon: '💱', title: 'متعدد العملات', desc: 'أسعار بـ 10 عملات مع تحويل فوري' },
                { icon: '✅', title: 'وكلاء معتمدون', desc: 'شبكة وكلاء موثوقة مع عملية تحقق صارمة' },
              ]
            : [
                { icon: '🤖', title: 'Advanced AI', desc: 'Semantic search, vision analysis, and price estimation powered by Gemini AI' },
                { icon: '🌐', title: 'Fully Bilingual', desc: 'Complete Arabic and English support with RTL' },
                { icon: '💱', title: 'Multi-Currency', desc: 'Prices in 10 currencies with instant conversion' },
                { icon: '✅', title: 'Verified Dealers', desc: 'Trusted dealer network with rigorous verification' },
              ]
          ).map((item, i) => (
            <div key={i} className={`flex gap-4 rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl">{item.icon}</div>
              <div>
                <h3 className={`font-semibold ${heading}`}>{item.title}</h3>
                <p className={`text-sm ${body}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className={`rounded-2xl border p-6 text-center ${card}`}>
        <p className={`font-semibold ${heading}`}>
          {isAr ? 'تواصل معنا' : 'Get In Touch'}
        </p>
        <p className={`mt-2 ${body}`}>
          📧 intelliwheels03@gmail.com &nbsp;|&nbsp; 📞 +962 77 738 1408 &nbsp;|&nbsp; 📍 {isAr ? 'عمان، الأردن' : 'Amman, Jordan'}
        </p>
      </div>
    </div>
  );
}

export function HowItWorksPage({ theme, language, onNavigate }: InfoPageProps) {
  const isDark = theme === 'dark';
  const isAr = language === 'ar';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';

  const buyerSteps = isAr
    ? [
        { icon: '🔍', title: 'تصفح وابحث', desc: 'استكشف الكتالوج أو استخدم البحث الذكي بالذكاء الاصطناعي لوصف سيارة أحلامك.' },
        { icon: '🤖', title: 'احصل على رؤى ذكية', desc: 'استخدم المساعد الذكي للحصول على تقديرات أسعار، مقارنات، وتحليل صور.' },
        { icon: '✅', title: 'تحقق من السعر', desc: 'احصل على تقدير السعر العادل بالتعلم الآلي لتتأكد أنك تحصل على صفقة جيدة.' },
        { icon: '💬', title: 'تواصل مع البائع', desc: 'راسل البائع أو الوكيل مباشرة من خلال نظام المراسلة المدمج.' },
        { icon: '🤝', title: 'أتمم الصفقة', desc: 'التقِ بالبائع، افحص السيارة، وأتمم عملية الشراء بثقة.' },
      ]
    : [
        { icon: '🔍', title: 'Browse & Search', desc: 'Explore the catalog or use AI semantic search to describe your dream car in natural language.' },
        { icon: '🤖', title: 'Get AI Insights', desc: 'Chat with our AI assistant for price estimates, comparisons, and photo-based car identification.' },
        { icon: '✅', title: 'Verify the Price', desc: 'Get ML-powered fair price estimates to ensure you\'re getting a good deal.' },
        { icon: '💬', title: 'Contact the Seller', desc: 'Message the seller or dealer directly through our built-in messaging system.' },
        { icon: '🤝', title: 'Close the Deal', desc: 'Meet the seller, inspect the car, and complete your purchase with confidence.' },
      ];

  const sellerSteps = isAr
    ? [
        { icon: '📝', title: 'أنشئ إعلانك', desc: 'أضف تفاصيل سيارتك يدوياً أو استخدم مساعد الإعلانات بالذكاء الاصطناعي.' },
        { icon: '📸', title: 'أضف الصور', desc: 'ارفع صور عالية الجودة. يمكن للذكاء الاصطناعي تحليلها وملء التفاصيل تلقائياً.' },
        { icon: '💰', title: 'حدد السعر', desc: 'استخدم أداة تقدير الأسعار لتحديد سعر عادل ومنافس.' },
        { icon: '📊', title: 'تتبع الأداء', desc: 'راقب المشاهدات والاستفسارات من خلال لوحة التحليلات.' },
      ]
    : [
        { icon: '📝', title: 'Create Your Listing', desc: 'Add your car details manually or use the AI Listing Assistant for guided creation.' },
        { icon: '📸', title: 'Add Photos', desc: 'Upload high-quality photos. Our AI can analyze them and auto-fill specifications.' },
        { icon: '💰', title: 'Set Your Price', desc: 'Use the price estimation tool to set a fair and competitive price.' },
        { icon: '📊', title: 'Track Performance', desc: 'Monitor views and inquiries through the analytics dashboard.' },
      ];

  return (
    <div className="mx-auto max-w-4xl space-y-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className={`text-3xl font-bold md:text-4xl ${heading}`}>
          {isAr ? 'كيف يعمل IntelliWheels؟' : 'How IntelliWheels Works'}
        </h1>
        <p className={`mt-2 ${body}`}>
          {isAr ? 'دليلك الكامل لشراء وبيع السيارات بذكاء' : 'Your complete guide to buying and selling cars intelligently'}
        </p>
      </div>

      {/* For Buyers */}
      <div>
        <h2 className={`text-2xl font-bold ${heading}`}>
          {isAr ? '🛒 للمشترين' : '🛒 For Buyers'}
        </h2>
        <div className="mt-6 space-y-4">
          {buyerSteps.map((step, i) => (
            <div key={i} className={`flex items-start gap-4 rounded-2xl border p-5 ${card}`}>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {isAr ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                  </span>
                </div>
                <h3 className={`mt-1 font-semibold ${heading}`}>{step.title}</h3>
                <p className={`mt-1 text-sm ${body}`}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* For Sellers */}
      <div>
        <h2 className={`text-2xl font-bold ${heading}`}>
          {isAr ? '🏷️ للبائعين' : '🏷️ For Sellers'}
        </h2>
        <div className="mt-6 space-y-4">
          {sellerSteps.map((step, i) => (
            <div key={i} className={`flex items-start gap-4 rounded-2xl border p-5 ${card}`}>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {isAr ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                  </span>
                </div>
                <h3 className={`mt-1 font-semibold ${heading}`}>{step.title}</h3>
                <p className={`mt-1 text-sm ${body}`}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="relative px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white">
            {isAr ? 'مستعد للبدء؟' : 'Ready to Get Started?'}
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onNavigate('listings')}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-600 shadow hover:bg-indigo-50"
            >
              {isAr ? 'تصفح السيارات' : 'Browse Cars'}
            </button>
            <button
              onClick={() => onNavigate('addListing')}
              className="rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              {isAr ? 'أضف سيارتك' : 'List Your Car'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactPage({ theme, language }: InfoPageProps) {
  const isDark = theme === 'dark';
  const isAr = language === 'ar';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';

  return (
    <div className="mx-auto max-w-4xl space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className={`text-3xl font-bold md:text-4xl ${heading}`}>
          {isAr ? 'تواصل معنا' : 'Contact Us'}
        </h1>
        <p className={`mt-2 ${body}`}>
          {isAr ? 'نحن هنا لمساعدتك. تواصل معنا بالطريقة الأنسب لك.' : 'We\'re here to help. Reach out in the way that works best for you.'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            icon: '📧',
            title: isAr ? 'البريد الإلكتروني' : 'Email',
            value: 'intelliwheels03@gmail.com',
            desc: isAr ? 'للاستفسارات العامة والدعم الفني' : 'For general inquiries and technical support',
            href: 'mailto:intelliwheels03@gmail.com',
          },
          {
            icon: '📱',
            title: isAr ? 'واتساب' : 'WhatsApp',
            value: '+962 77 738 1408',
            desc: isAr ? 'تواصل معنا مباشرة عبر واتساب' : 'Chat with us directly on WhatsApp',
            href: 'https://wa.me/962777381408',
          },
          {
            icon: '📞',
            title: isAr ? 'الهاتف' : 'Phone',
            value: '+962 77 738 1408',
            desc: isAr ? 'أوقات العمل: 9 صباحاً - 6 مساءً (بتوقيت الأردن)' : 'Business hours: 9 AM – 6 PM (Jordan time)',
            href: 'tel:+962777381408',
          },
          {
            icon: '📍',
            title: isAr ? 'الموقع' : 'Location',
            value: isAr ? 'عمان، الأردن' : 'Amman, Jordan',
            desc: isAr ? 'مقرنا الرئيسي' : 'Our headquarters',
            href: 'https://maps.google.com/?q=Amman,Jordan',
          },
        ].map((contact, i) => (
          <a
            key={i}
            href={contact.href}
            target="_blank"
            rel="noreferrer"
            className={`group rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg ${card}`}
          >
            <div className="text-3xl">{contact.icon}</div>
            <h3 className={`mt-3 text-lg font-semibold ${heading}`}>{contact.title}</h3>
            <p className={`mt-1 font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{contact.value}</p>
            <p className={`mt-1 text-sm ${body}`}>{contact.desc}</p>
          </a>
        ))}
      </div>

      {/* Social Media */}
      <div className={`rounded-2xl border p-6 text-center ${card}`}>
        <h2 className={`text-xl font-semibold ${heading}`}>
          {isAr ? 'تابعنا' : 'Follow Us'}
        </h2>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <a href="https://www.instagram.com/intelli_wheels1/" target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition hover:-translate-y-0.5 ${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            📷 Instagram
          </a>
          <a href="https://www.facebook.com/people/IntelliWheels/61574026498498/" target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition hover:-translate-y-0.5 ${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            👤 Facebook
          </a>
        </div>
      </div>
    </div>
  );
}

export function PricingPage({ theme, language, onNavigate }: InfoPageProps) {
  const isDark = theme === 'dark';
  const isAr = language === 'ar';
  const heading = isDark ? 'text-white' : 'text-slate-900';
  const body = isDark ? 'text-slate-300' : 'text-slate-600';
  const card = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200';

  const dealerPlans = isAr
    ? [
        {
          name: 'أساسي',
          price: 'مجاني',
          period: '',
          highlight: false,
          features: ['10 إعلانات', 'تحليلات أساسية', 'دعم عادي', 'ملف تعريف الوكيل'],
        },
        {
          name: 'احترافي',
          price: '50',
          period: 'دينار/شهرياً',
          highlight: true,
          features: ['50 إعلان', 'تحليلات متقدمة', 'دعم أولوية', 'شارة موثق', 'ظهور مميز في البحث', 'تقارير شهرية'],
        },
        {
          name: 'مؤسسي',
          price: 'مخصص',
          period: '',
          highlight: false,
          features: ['إعلانات غير محدودة', 'وصول للـ API', 'دعم مخصص', 'تكامل مع أنظمتك', 'حسابات متعددة', 'تقارير مخصصة'],
        },
      ]
    : [
        {
          name: 'Basic',
          price: 'Free',
          period: '',
          highlight: false,
          features: ['10 Listings', 'Basic Analytics', 'Standard Support', 'Dealer Profile'],
        },
        {
          name: 'Pro',
          price: '50',
          period: 'JOD/month',
          highlight: true,
          features: ['50 Listings', 'Advanced Analytics', 'Priority Support', 'Verified Badge', 'Featured in Search', 'Monthly Reports'],
        },
        {
          name: 'Enterprise',
          price: 'Custom',
          period: '',
          highlight: false,
          features: ['Unlimited Listings', 'API Access', 'Dedicated Support', 'System Integration', 'Multi-User Access', 'Custom Reports'],
        },
      ];

  return (
    <div className="mx-auto max-w-5xl space-y-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <h1 className={`text-3xl font-bold md:text-4xl ${heading}`}>
          {isAr ? 'الأسعار والباقات' : 'Pricing & Plans'}
        </h1>
        <p className={`mt-2 ${body}`}>
          {isAr ? 'مجاني للمشترين. باقات مرنة للوكلاء.' : 'Free for buyers. Flexible plans for dealers.'}
        </p>
      </div>

      {/* Free for Buyers */}
      <div className={`rounded-2xl border p-6 text-center ${card}`}>
        <div className="text-4xl">🚗</div>
        <h2 className={`mt-3 text-2xl font-bold ${heading}`}>
          {isAr ? 'مجاني تماماً للمشترين' : 'Completely Free for Buyers'}
        </h2>
        <p className={`mt-2 ${body}`}>
          {isAr
            ? 'تصفح، ابحث، أضف للمفضلة، تواصل مع البائعين، وأنشئ إعلاناتك — كل ذلك مجاناً!'
            : 'Browse, search, save favorites, contact sellers, and create listings — all for free!'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
          {(isAr
            ? ['✅ تصفح غير محدود', '✅ بحث ذكي بالذكاء الاصطناعي', '✅ مفضلات', '✅ رسائل مباشرة', '✅ إضافة إعلانات', '✅ دردشة مع المساعد الذكي']
            : ['✅ Unlimited Browsing', '✅ AI Semantic Search', '✅ Favorites', '✅ Direct Messaging', '✅ Add Listings', '✅ AI Assistant Chat']
          ).map((f, i) => (
            <span key={i} className={`rounded-lg px-3 py-1.5 ${isDark ? 'bg-slate-700' : 'bg-slate-100'} ${heading}`}>{f}</span>
          ))}
        </div>
      </div>

      {/* Dealer Plans */}
      <div>
        <h2 className={`text-center text-2xl font-bold ${heading}`}>
          {isAr ? '👔 باقات الوكلاء' : '👔 Dealer Plans'}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {dealerPlans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                  : card
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-1 text-xs font-bold text-white">
                  {isAr ? 'الأكثر شعبية' : 'Most Popular'}
                </div>
              )}
              <h3 className={`text-xl font-bold ${heading}`}>{plan.name}</h3>
              <div className="mt-3">
                <span className={`text-4xl font-bold ${heading}`}>
                  {plan.price === 'Free' || plan.price === 'مجاني' || plan.price === 'Custom' || plan.price === 'مخصص' ? plan.price : `${plan.price}`}
                </span>
                {plan.period && <span className={`text-sm ${body}`}> {plan.period}</span>}
              </div>
              <ul className={`mt-6 space-y-3 ${body}`}>
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onNavigate('dealers')}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                  plan.highlight
                    ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {plan.price === 'Free' || plan.price === 'مجاني' ? (isAr ? 'ابدأ مجاناً' : 'Get Started Free') : (isAr ? 'تواصل معنا' : 'Contact Us')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Premium (Future) */}
      <div className={`rounded-2xl border p-6 md:p-8 ${card}`}>
        <h2 className={`text-xl font-bold ${heading}`}>
          {isAr ? '🤖 ميزات الذكاء الاصطناعي المتقدمة (قريباً)' : '🤖 AI Premium Features (Coming Soon)'}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(isAr
            ? [
                { name: 'فحص السعر السريع', price: '2 دينار', desc: 'تقييم فوري مع درجة عدالة السعر' },
                { name: 'تقرير السعر الكامل', price: '5 دنانير', desc: 'تحليل مفصل مع نصائح تفاوض' },
                { name: 'اشتراك AI', price: '10 دنانير/شهرياً', desc: 'فحوصات غير محدودة' },
                { name: 'تعزيز الإعلان', price: '5 دنانير', desc: 'وصف محسن بالذكاء الاصطناعي' },
              ]
            : [
                { name: 'Quick Price Check', price: '2 JOD', desc: 'Instant valuation with fairness score' },
                { name: 'Full Price Report', price: '5 JOD', desc: 'Detailed analysis with negotiation tips' },
                { name: 'AI Subscription', price: '10 JOD/mo', desc: 'Unlimited price checks' },
                { name: 'Listing Boost', price: '5 JOD', desc: 'AI-optimized listing description' },
              ]
          ).map((item, i) => (
            <div key={i} className={`flex items-center justify-between rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div>
                <p className={`font-semibold ${heading}`}>{item.name}</p>
                <p className={`text-sm ${body}`}>{item.desc}</p>
              </div>
              <span className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
