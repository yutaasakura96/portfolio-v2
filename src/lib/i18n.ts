import type { Locale } from "./locale";

export function t<T extends Record<string, unknown>>(
  record: T,
  field: string & keyof T,
  locale: Locale
): string {
  if (locale === "ja") {
    const jaField = `${field}Ja` as keyof T;
    const jaValue = record[jaField];
    if (typeof jaValue === "string" && jaValue.trim()) return jaValue;
  }
  const value = record[field];
  return typeof value === "string" ? value : "";
}

export function tArray<T extends Record<string, unknown>>(
  record: T,
  field: string & keyof T,
  locale: Locale
): string[] {
  if (locale === "ja") {
    const jaField = `${field}Ja` as keyof T;
    const jaValue = record[jaField];
    if (Array.isArray(jaValue) && jaValue.length > 0) return jaValue as string[];
  }
  const value = record[field];
  return Array.isArray(value) ? (value as string[]) : [];
}

export function tJson<T extends Record<string, unknown>, R>(
  record: T,
  field: string & keyof T,
  locale: Locale
): R {
  if (locale === "ja") {
    const jaField = `${field}Ja` as keyof T;
    const jaValue = record[jaField];
    if (jaValue !== null && jaValue !== undefined) return jaValue as R;
  }
  return record[field] as R;
}

const UI_STRINGS = {
  en: {
    home: "Home",
    projects: "Projects",
    blog: "Blog",
    about: "About",
    contact: "Contact",
    featuredProjects: "Featured Projects",
    recentPosts: "Recent Posts",
    viewAllProjects: "View All Projects",
    viewAllPosts: "View All Posts",
    getInTouch: "Get in Touch",
    getInTouchDescription: "Interested in working together? Feel free to reach out.",
    contactMe: "Contact Me",
    skills: "Skills",
    experience: "Experience",
    education: "Education",
    certifications: "Certifications",
    problem: "Problem",
    solution: "Solution",
    role: "Role",
    technologies: "Technologies",
    liveDemo: "Live Demo",
    sourceCode: "Source Code",
    readMore: "Read More",
    sharePost: "Share this post",
    tableOfContents: "Table of Contents",
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    send: "Send Message",
    sending: "Sending...",
    contactSuccess: "Message sent successfully!",
    contactDescription:
      "Have a question or want to work together? Send me a message and I'll get back to you as soon as possible.",
    minRead: "min read",
    present: "Present",
    viewCredential: "View Credential",
    expires: "Expires",
    noExpiration: "No Expiration",
    previous: "Previous",
    next: "Next",
    availableForOpportunities: "Available for new opportunities",
    portfolio: "Portfolio",
    viewAll: "View all",
    hello: "Hello, I'm",
    allProjects: "All Projects",
    allPosts: "All Posts",
    techStack: "Tech Stack",
    theProblem: "The Problem",
    theSolution: "The Solution",
    enjoyedPost: "Enjoyed this post?",
    getLoveToHear: "— I'd love to hear your thoughts.",
    searchProjects: "Search projects...",
    defaultOrder: "Default Order",
    newestFirst: "Newest First",
    oldestFirst: "Oldest First",
    aToZ: "A → Z",
    clear: "Clear",
    noProjectsFound: "No projects found matching your criteria.",
    clearFilters: "Clear filters",
    projectsFound: "found",
    projectsPageDescription:
      "A collection of projects I've built, from full-stack applications to developer tools.",
    blogPageDescription: "Thoughts on web development, software engineering, and technology.",
    noBlogPosts: "No blog posts published yet. Check back soon!",
    heroName: "Yuta Asakura!",
    heroNameJa: "朝倉優太です!",
    viewCertificate: "View Certificate",
    earned: "Earned",
    contactPageTitle: "Get in Touch",
    contactPageDescription:
      "Have a question, project idea, or just want to say hello? Fill out the form below and I'll get back to you as soon as possible.",
    whatToExpect: "What to Expect",
    whatToExpectLine1: "I'll reply to the email address you provide in the form.",
    whatToExpectLine2: "Project inquiries, collaborations, and general questions are all welcome.",
    responseTime: "Response Time",
    responseTimeDescription: "I typically respond within 1–2 business days.",
    messageSent: "Message sent!",
    messageSentDescription: "Thank you for reaching out. I'll get back to you as soon as possible.",
    sendAnother: "Send another message",
    yourName: "Your name",
    yourEmail: "your@email.com",
    subjectPlaceholder: "What is this about?",
    messagePlaceholder: "Your message...",
    copyright: "Yuta Asakura | Portfolio",
    skillCategoryLanguages: "Languages",
    skillCategoryFrameworks: "Frameworks",
    skillCategoryCloud: "Cloud & DevOps",
    skillCategoryDatabases: "Databases",
    skillCategoryTools: "Tools",
    skillCategoryOther: "Other",
    pageNotFound: "Page not found",
    pageNotFoundDescription: "Sorry, the page you're looking for doesn't exist or has been moved.",
    goHome: "Go Home",
    viewProjects: "View Projects",
    readTheBlog: "Read the Blog",
    somethingWentWrong: "Something went wrong",
    unexpectedError: "Unexpected Error",
    errorPageDescription: "An error occurred while loading this page. Please try again.",
    tryAgain: "Try Again",
    errorLoadingProject: "Error loading project",
    errorProjectDescription: "Something went wrong. The project may have been removed.",
    errorLoadingPost: "Error loading post",
    errorPostDescription: "Something went wrong. The post may have been removed.",
    share: "Share",
    linkCopied: "Link copied to clipboard",
    copyFailed: "Failed to copy link",
    tooManyMessages: "Too many messages sent. Please try again in a few minutes.",
    networkError: "Network error. Please check your connection and try again.",
    aboutMe: "About Me",
    aboutMeSubheading: "My skills, professional experience, education, and certifications.",
  },
  ja: {
    home: "ホーム",
    projects: "プロジェクト",
    blog: "ブログ",
    about: "自己紹介",
    contact: "お問い合わせ",
    featuredProjects: "注目プロジェクト",
    recentPosts: "最新記事",
    viewAllProjects: "すべてのプロジェクトを見る",
    viewAllPosts: "すべての記事を見る",
    getInTouch: "お問い合わせ",
    getInTouchDescription: "一緒にお仕事しませんか？お気軽にご連絡ください。",
    contactMe: "お問い合わせ",
    skills: "スキル",
    experience: "職歴",
    education: "学歴",
    certifications: "資格",
    problem: "課題",
    solution: "解決策",
    role: "役割",
    technologies: "技術スタック",
    liveDemo: "デモサイト",
    sourceCode: "ソースコード",
    readMore: "続きを読む",
    sharePost: "この記事をシェア",
    tableOfContents: "目次",
    name: "お名前",
    email: "メールアドレス",
    subject: "件名",
    message: "メッセージ",
    send: "送信する",
    sending: "送信中...",
    contactSuccess: "メッセージを送信しました！",
    contactDescription:
      "ご質問やお仕事のご依頼がございましたら、お気軽にメッセージをお送りください。",
    minRead: "分で読めます",
    present: "現在",
    viewCredential: "資格を確認",
    expires: "有効期限",
    noExpiration: "無期限",
    previous: "前へ",
    next: "次へ",
    availableForOpportunities: "新しい機会を探しています",
    portfolio: "ポートフォリオ",
    viewAll: "すべて見る",
    hello: "こんにちは、",
    allProjects: "すべてのプロジェクト",
    allPosts: "すべての記事",
    techStack: "技術スタック",
    theProblem: "課題",
    theSolution: "解決策",
    enjoyedPost: "この記事はいかがでしたか？",
    getLoveToHear: "ご感想をお聞かせください。",
    searchProjects: "プロジェクトを検索...",
    defaultOrder: "デフォルト順",
    newestFirst: "新しい順",
    oldestFirst: "古い順",
    aToZ: "A → Z",
    clear: "クリア",
    noProjectsFound: "条件に一致するプロジェクトが見つかりません。",
    clearFilters: "フィルターをクリア",
    projectsFound: "件",
    projectsPageDescription:
      "フルスタックアプリケーションから開発者ツールまで、私が構築したプロジェクト集です。",
    blogPageDescription: "Web開発、ソフトウェアエンジニアリング、テクノロジーについての記事。",
    noBlogPosts: "まだブログ記事がありません。近日公開予定です！",
    heroName: "Yuta Asakura!",
    heroNameJa: "朝倉優太です!",
    viewCertificate: "証明書を見る",
    earned: "取得日",
    contactPageTitle: "お問い合わせ",
    contactPageDescription:
      "ご質問、プロジェクトのアイデア、またはご挨拶がございましたら、以下のフォームからお気軽にどうぞ。できるだけ早くお返事いたします。",
    whatToExpect: "ご連絡について",
    whatToExpectLine1: "フォームにご記入いただいたメールアドレスにお返事いたします。",
    whatToExpectLine2:
      "プロジェクトのご相談、コラボレーション、一般的なご質問など、お気軽にどうぞ。",
    responseTime: "返信時間",
    responseTimeDescription: "通常1〜2営業日以内にお返事いたします。",
    messageSent: "メッセージを送信しました！",
    messageSentDescription: "お問い合わせありがとうございます。できるだけ早くお返事いたします。",
    sendAnother: "別のメッセージを送る",
    yourName: "お名前",
    yourEmail: "メールアドレス",
    subjectPlaceholder: "件名を入力してください",
    messagePlaceholder: "メッセージを入力してください...",
    copyright: "朝倉優太 | ポートフォリオ",
    skillCategoryLanguages: "言語",
    skillCategoryFrameworks: "フレームワーク",
    skillCategoryCloud: "クラウド & DevOps",
    skillCategoryDatabases: "データベース",
    skillCategoryTools: "ツール",
    skillCategoryOther: "その他",
    pageNotFound: "ページが見つかりません",
    pageNotFoundDescription:
      "申し訳ございません。お探しのページは存在しないか、移動された可能性があります。",
    goHome: "ホームへ戻る",
    viewProjects: "プロジェクトを見る",
    readTheBlog: "ブログを読む",
    somethingWentWrong: "エラーが発生しました",
    unexpectedError: "予期せぬエラー",
    errorPageDescription: "ページの読み込み中にエラーが発生しました。もう一度お試しください。",
    tryAgain: "再試行",
    errorLoadingProject: "プロジェクトの読み込みエラー",
    errorProjectDescription: "エラーが発生しました。プロジェクトが削除された可能性があります。",
    errorLoadingPost: "記事の読み込みエラー",
    errorPostDescription: "エラーが発生しました。記事が削除された可能性があります。",
    share: "シェア",
    linkCopied: "リンクをコピーしました",
    copyFailed: "リンクのコピーに失敗しました",
    tooManyMessages: "メッセージの送信回数が上限に達しました。数分後に再度お試しください。",
    networkError: "ネットワークエラーです。接続を確認して再度お試しください。",
    aboutMe: "自己紹介",
    aboutMeSubheading: "スキル、職務経歴、学歴、および資格について。",
  },
} as const;

export type UIStringKey = keyof (typeof UI_STRINGS)["en"];

export function ui(key: UIStringKey, locale: Locale): string {
  return UI_STRINGS[locale][key];
}

const SKILL_CATEGORY_MAP: Record<string, string> = {
  Languages: "言語",
  Frontend: "フロントエンド",
  Backend: "バックエンド",
  Frameworks: "フレームワーク",
  "Cloud & DevOps": "クラウド & DevOps",
  "AWS Services": "AWSサービス",
  Databases: "データベース",
  Tools: "ツール",
  Other: "その他",
};

export function localizeSkillCategory(category: string, locale: Locale): string {
  if (locale === "ja" && SKILL_CATEGORY_MAP[category]) {
    return SKILL_CATEGORY_MAP[category];
  }
  return category;
}
