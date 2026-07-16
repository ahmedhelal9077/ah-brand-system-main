const lucide = require("lucide-react");
const icons = ["LayoutDashboard", "Users", "Package", "Tags", "ShoppingCart", "LogOut", "Printer", "FileText", "Settings", "Bell", "RefreshCcw", "Menu", "ChevronLeft", "ChevronRight", "Activity", "AlertTriangle", "Moon", "Sun", "Globe", "Store", "Wallet", "ScanBarcode", "Building2"];

const missing = icons.filter(icon => !lucide[icon]);
console.log("Missing icons:", missing);
