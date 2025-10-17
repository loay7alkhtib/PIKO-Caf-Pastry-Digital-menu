# 🥐 Piko Patisserie & Café - Digital Menu App

A fast, elegant digital menu web application built with React, Tailwind CSS, and Supabase.

## ✨ Features

### 🎨 **Design**
- Minimal, elegant design with brand color #0C6071 (teal)
- Gelica font (EN) and IBM Plex Sans Arabic (AR)
- Full RTL support for Arabic
- Responsive from mobile to ultrawide screens

### 🌍 **Multi-Language**
- English, Turkish, and Arabic
- Real-time language switching
- Proper RTL layout for Arabic

### 📱 **User Features**
- Browse menu categories and items
- View item details with variants (sizes)
- Shopping cart system
- Order placement

### 🔐 **Admin Panel**
- Hidden admin panel (triple-tap logo)
- Full CRUD for categories and items
- Drag-and-drop reordering
- Image management (Unsplash API)
- Size variants with multilingual support
- Order management
- **Smart Menu Upload** - Upload ~350 items via JSON
- **History System** - Soft delete with restore capability
- **Session Persistence** - Stay logged in for 7 days

---

## 🚀 Quick Start

### **Admin Login:**
```
Triple-tap the logo anywhere in the app
Email: admin@piko.com
Password: admin123
```

### **Upload Menu:**
1. Login to admin panel
2. Go to "Auto Process Menu" section
3. Upload `piko_smart_upload.json` file
4. Wait for processing to complete
5. All ~350 items loaded with duplicate consolidation!

---

## 🛠️ Current Admin Tools

### **1. Auto Process Menu** ⭐ PRIMARY TOOL
**Location**: Admin Panel (top section)  
**Purpose**: Upload your complete menu from JSON file

**Features:**
- ✅ Upload or paste JSON data
- ✅ Automatic duplicate consolidation
- ✅ Real-time progress tracking
- ✅ Processes ~350 items in seconds
- ✅ Direct upload to Supabase

**Usage:**
```
1. Click "Choose JSON File" or paste JSON
2. Click "Process & Upload Menu"
3. Watch real-time progress
4. Done! ✅
```

### **2. History Panel** 🗄️
**Location**: Admin Panel → History Tab  
**Purpose**: Recover deleted items/categories

**Features:**
- ✅ View all deleted items
- ✅ One-click restore
- ✅ Statistics dashboard
- ✅ Permanent delete option

**Usage:**
```
1. Go to History tab
2. Browse deleted items
3. Click "Restore" to bring back
4. Or "Delete Forever" to permanently remove
```

### **3. Session Debugger** 🔍
**Location**: Admin Panel (below Auto Process Menu)  
**Purpose**: Monitor your login session

**Features:**
- ✅ Session status check
- ✅ Age tracking
- ✅ Server verification
- ✅ Manual session refresh

---

## 📂 Project Structure

```
├── components/
│   ├── admin/
│   │   ├── AdminCategories.tsx    # Category management
│   │   ├── AdminItems.tsx         # Item management
│   │   ├── AdminOrders.tsx        # Order management
│   │   ├── AutoProcessMenu.tsx    # ⭐ Smart menu uploader
│   │   ├── HistoryPanel.tsx       # Archive system
│   │   ├── SessionDebugger.tsx    # Session monitor
│   │   ├── DraggableCategory.tsx  # Drag & drop for categories
│   │   └── DraggableItem.tsx      # Drag & drop for items
│   ├── CartSheet.tsx              # Shopping cart
│   ├── ItemCard.tsx               # Menu item card
│   ├── ItemPreview.tsx            # Item detail dialog
│   └── ui/                        # Shadcn UI components
├── lib/
│   ├── DataContext.tsx            # Global data cache
│   ├── CartContext.tsx            # Cart state
│   ├── LangContext.tsx            # Language state
│   ├── sessionManager.ts          # Session persistence
│   └── supabase.ts                # API client
├── pages/
│   ├── Home.tsx                   # Landing page
│   ├── CategoryMenu.tsx           # Menu browsing
│   ├── Admin.tsx                  # Admin dashboard
│   └── AdminLogin.tsx             # Login page
└── supabase/functions/server/
    └── index.tsx                  # Backend API
```

---

## 🎯 Key Systems

### **Data Caching (DataContext)**
- Prevents unnecessary API calls
- 5-minute TTL for categories
- Instant page loads
- Auto-refresh on data changes

### **Session Persistence**
- 7-day session expiry
- Auto-recovery on page refresh
- Resilient to network errors
- localStorage-based

### **History & Archive**
- Soft delete system
- All deletions recoverable
- Timestamped entries
- One-click restore

### **Smart Menu Upload**
- Handles 350+ items
- Duplicate consolidation
- Variant merging
- Real-time progress

---

## 📊 Admin Workflow

### **Initial Setup:**
```
1. Login to admin (admin@piko.com / admin123)
2. Use Auto Process Menu
3. Upload piko_smart_upload.json
4. Done! Menu is loaded
```

### **Daily Management:**
```
1. Categories Tab - Manage categories
2. Items Tab - Edit menu items
3. Orders Tab - View customer orders
4. History Tab - Restore deleted items
```

### **Editing Items:**
```
1. Click "Edit" on any item
2. Update names (EN/TR/AR)
3. Change price or add variants
4. Upload/change image
5. Save changes
```

### **Managing Variants:**
```
1. Edit item
2. Click "Add Variant"
3. Enter size name (EN/TR/AR)
4. Set price
5. Save
```

---

## 🔧 Configuration

### **Session Expiry:**
Edit `/lib/sessionManager.ts`:
```typescript
const SESSION_EXPIRY_DAYS = 7; // Change this
```

### **API Endpoint:**
Located in `/lib/supabase.ts`:
```typescript
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4050140e`;
```

---

## 📚 Documentation

### **Available Guides:**
- `COMPLETE_FIXES_SUMMARY.md` - All recent fixes
- `HISTORY_SYSTEM_GUIDE.md` - Archive system details
- `SESSION_PERSISTENCE_FIX.md` - Session handling
- `Attributions.md` - Credits

---

## 🐛 Troubleshooting

### **Session Issues:**
```
1. Check SessionDebugger in admin panel
2. Verify localStorage is enabled
3. Clear browser cache
4. Login again
```

### **Menu Upload Issues:**
```
1. Verify JSON file format
2. Check browser console
3. Ensure file is < 5MB
4. Try paste JSON instead
```

### **Items Not Showing:**
```
1. Check if category exists
2. Verify item has valid category_id
3. Refresh DataContext
4. Check History tab (might be archived)
```

---

## 🎨 Brand Colors

```css
Primary Teal: #0C6071
Background: #FAFAFA
Card: #FFFFFF
Text: #1A1A1A
Muted: #6B7280
```

---

## 🚀 Performance

- **Initial Load**: < 2s
- **Category Switch**: < 500ms
- **Item Details**: Instant (cached)
- **Menu Upload**: ~350 items in 3-5s
- **Data Caching**: 5-minute TTL

---

## ✅ Production Checklist

- ✅ Multi-language support (EN/TR/AR)
- ✅ RTL layout for Arabic
- ✅ Responsive design
- ✅ Shopping cart
- ✅ Order system
- ✅ Admin panel
- ✅ Session persistence
- ✅ History system
- ✅ Smart menu upload
- ✅ Image management
- ✅ Drag & drop reordering
- ✅ Size variants
- ✅ Data caching
- ✅ Error handling

---

## 📝 Notes

- Admin credentials stored in KV store
- Sessions persist for 7 days
- Deleted items recoverable for unlimited time
- Images via Unsplash API (free)
- Menu data in `piko_smart_upload.json`

---

**Built with ❤️ for Piko Patisserie & Café**  
**Version**: 2.0.0  
**Last Updated**: October 2025
