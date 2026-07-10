type TranslationDict = {
  dashboard: string;
  store: string;
  pos: string;
  inventory: string;
  reservations: string;
  login: string;
  logout: string;
  username: string;
  password: string;
  lightMode: string;
  darkMode: string;
  language: string;
  products: string;
  categories: string;
  addStock: string;
  deductStock: string;
  reserve: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  confirmDeduct: string;
  confirmReserve: string;
  roleOwner: string;
  roleEmployee: string;
  unauthorized: string;
  quantity: string;
  price: string;
  color: string;
  image: string;
  uploadImage: string;
  outOfStock: string;
  available: string;
  viewOnly: string;
  siteTitle: string;
  overview: string;
  userManagement: string;
  bagInventory: string;
  productsManagement: string;
  categoriesManagement: string;
  addCategory: string;
  categoryName: string;
  addProduct: string;
  bagName: string;
  priceEgp: string;
  noCategory: string;
  productCatalog: string;
  code: string;
  name: string;
  actions: string;
  uncategorized: string;
  variants: string;
  totalProducts: string;
  noCategoriesFound: string;
  cannotDelete: string;
  cannotExceedStock: string;
  saleSuccess: string;
  reserveSuccess: string;
  searchPosPlaceholder: string;
  currentOrder: string;
  cartEmpty: string;
  total: string;
  processing: string;
  confirmationRequired: string;
  noMatchingItems: string;
  dashboardOverview: string;
  realtimeInsights: string;
  todaysRevenue: string;
  totalProductModels: string;
  lowStockVariants: string;
  todaysRecentSales: string;
  time: string;
  employee: string;
  items: string;
  noSalesToday: string;
  employeePerformance: string;
  noDataYet: string;
  salesCount: string;
  activityLog: string;
  salesHistory: string;
  warehousePerformance: string;
  barcodes: string;
  settings: string;
  issues: string;
  contactUs: string;
  ourBranches: string;
  allCategories: string;
  priceAll: string;
  priceUnder500: string;
  price500to1000: string;
  price1000to2000: string;
  priceAbove2000: string;
};

export type Language = "ar" | "en";
export type TranslationKey = keyof TranslationDict;

export const translations: Record<Language, TranslationDict> = {
  ar: {
    dashboard: "لوحة التحكم",
    store: "المتجر",
    pos: "نقطة البيع",
    inventory: "المخزون",
    reservations: "الحجوزات",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    language: "اللغة",
    products: "المنتجات",
    categories: "الأقسام",
    addStock: "إضافة مخزون",
    deductStock: "خصم مخزون",
    reserve: "حجز",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    confirmDeduct: "هل أنت متأكد من خصم هذا المنتج؟",
    confirmReserve: "هل أنت متأكد من حجز هذا المنتج؟",
    roleOwner: "المالك",
    roleEmployee: "الموظف",
    unauthorized: "غير مصرح لك بإجراء هذا التعديل",
    quantity: "الكمية",
    price: "السعر",
    color: "اللون",
    image: "الصورة",
    uploadImage: "رفع صورة (اسحب وأفلت هنا)",
    outOfStock: "نفذت الكمية",
    available: "متاح",
    viewOnly: "للعرض فقط",
    siteTitle: "متجر AH Brand",
    overview: "نظرة عامة",
    userManagement: "إدارة المستخدمين",
    bagInventory: "مخزن الحقائب",
    productsManagement: "إدارة المنتجات",
    categoriesManagement: "إدارة الأقسام",
    addCategory: "إضافة قسم",
    categoryName: "اسم القسم",
    addProduct: "إضافة منتج",
    bagName: "اسم/موديل الشنطة",
    priceEgp: "السعر",
    noCategory: "-- بدون قسم --",
    productCatalog: "قائمة المنتجات",
    code: "الكود",
    name: "الاسم",
    actions: "الإجراءات",
    uncategorized: "غير مصنف",
    variants: "الألوان والمخزون",
    totalProducts: "إجمالي المنتجات",
    noCategoriesFound: "لا توجد أقسام.",
    cannotDelete: "لا يمكن الحذف",
    cannotExceedStock: "الكمية المطلوبة تتجاوز المخزون المتاح",
    saleSuccess: "تم تسجيل عملية البيع بنجاح!",
    reserveSuccess: "تم حجز المنتجات بنجاح!",
    searchPosPlaceholder: "ابحث بالاسم، الكود، اللون...",
    currentOrder: "الطلب الحالي",
    cartEmpty: "السلة فارغة",
    total: "الإجمالي:",
    processing: "جاري المعالجة...",
    confirmationRequired: "مطلوب التأكيد قبل الخصم من المخزون",
    noMatchingItems: "لا توجد منتجات مطابقة.",
    dashboardOverview: "نظرة عامة",
    realtimeInsights: "إحصائيات وتحليلات حية لعملك.",
    todaysRevenue: "أرباح اليوم",
    totalProductModels: "إجمالي موديلات المنتجات",
    lowStockVariants: "منتجات توشك على النفاذ",
    todaysRecentSales: "أحدث مبيعات اليوم",
    time: "الوقت",
    employee: "الموظف",
    items: "العناصر",
    noSalesToday: "لا توجد مبيعات اليوم بعد.",
    employeePerformance: "أداء الموظفين",
    noDataYet: "لا توجد بيانات بعد.",
    salesCount: "عملية بيع",
    activityLog: "سجل النشاط",
    salesHistory: "سجل المبيعات",
    warehousePerformance: "أداء المخزن",
    barcodes: "الباركود",
    settings: "الإعدادات",
    issues: "مشاكل التقفيل",
    contactUs: "التواصل:",
    ourBranches: "فروعنا:",
    allCategories: "الكل",
    priceAll: "الأسعار: الكل",
    priceUnder500: "أقل من 500 ج",
    price500to1000: "500 - 1000 ج",
    price1000to2000: "1000 - 2000 ج",
    priceAbove2000: "أكثر من 2000 ج",
  },
  en: {
    dashboard: "Dashboard",
    store: "Store",
    pos: "POS",
    inventory: "Inventory",
    reservations: "Reservations",
    login: "Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    products: "Products",
    categories: "Categories",
    addStock: "Add Stock",
    deductStock: "Deduct Stock",
    reserve: "Reserve",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirmDeduct: "Are you sure you want to deduct this product?",
    confirmReserve: "Are you sure you want to reserve this product?",
    roleOwner: "Owner",
    roleEmployee: "Employee",
    unauthorized: "You are not authorized to perform this action",
    quantity: "Quantity",
    price: "Price",
    color: "Color",
    image: "Image",
    uploadImage: "Upload Image (Drag & Drop here)",
    outOfStock: "Out of Stock",
    available: "Available",
    viewOnly: "View Only",
    siteTitle: "AH Brand Store",
    overview: "Overview",
    userManagement: "User Management",
    bagInventory: "Bag Inventory",
    productsManagement: "Products Management",
    categoriesManagement: "Categories Management",
    addCategory: "Add Category",
    categoryName: "Category Name",
    addProduct: "Add Product",
    bagName: "Bag Name / Model",
    priceEgp: "Price (EGP / $)",
    noCategory: "-- No Category --",
    productCatalog: "Product Catalog",
    code: "Code",
    name: "Name",
    actions: "Actions",
    uncategorized: "Uncategorized",
    variants: "Variants",
    totalProducts: "Total Products",
    noCategoriesFound: "No categories found.",
    cannotDelete: "Cannot delete",
    cannotExceedStock: "Cannot exceed available stock",
    saleSuccess: "Sale recorded successfully!",
    reserveSuccess: "Items reserved successfully!",
    searchPosPlaceholder: "Search by Name, Code, Color...",
    currentOrder: "Current Order",
    cartEmpty: "Cart is empty",
    total: "Total:",
    processing: "Processing...",
    confirmationRequired: "Confirmation required before deduction",
    noMatchingItems: "No matching items found.",
    dashboardOverview: "Dashboard Overview",
    realtimeInsights: "Real-time insights and analytics for your business.",
    todaysRevenue: "Today's Revenue",
    totalProductModels: "Total Product Models",
    lowStockVariants: "Low Stock Variants",
    todaysRecentSales: "Today's Recent Sales",
    time: "Time",
    employee: "Employee",
    items: "Items",
    noSalesToday: "No sales yet today.",
    employeePerformance: "Employee Performance",
    noDataYet: "No data yet.",
    salesCount: "sales",
    activityLog: "Activity Log",
    salesHistory: "Sales History",
    warehousePerformance: "Warehouse Performance",
    barcodes: "Barcodes",
    settings: "Settings",
    issues: "Closing Issues",
    contactUs: "Contact:",
    ourBranches: "Our Branches:",
    allCategories: "All",
    priceAll: "Prices: All",
    priceUnder500: "Under 500 EGP",
    price500to1000: "500 - 1000 EGP",
    price1000to2000: "1000 - 2000 EGP",
    priceAbove2000: "Above 2000 EGP",
  }
};

