import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'id' | 'es' | 'zh' | 'tl';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

export const translations: Translations = {
  // Common
  loading: { en: 'Loading...', id: 'Memuat...', es: 'Cargando...', zh: '加载中...', tl: 'Naglo-load...' },
  save: { en: 'Save Record', id: 'Simpan Data', es: 'Guardar Registro', zh: '保存记录', tl: 'I-save ang Record' },
  update: { en: 'Update Record', id: 'Perbarui Data', es: 'Actualizar Registro', zh: '更新记录', tl: 'I-update ang Record' },
  back: { en: 'Back', id: 'Kembali', es: 'Atrás', zh: '返回', tl: 'Bumalik' },
  
  // Login
  welcome: { en: 'Welcome back', id: 'Selamat datang kembali', es: 'Bienvenido de nuevo', zh: '欢迎回来', tl: 'Maligayang pagbabalik' },
  selectEmployee: { en: 'Please select your employee profile', id: 'Silakan pilih profil karyawan Anda', es: 'Por favor seleccione su perfil de empleado', zh: '请选择您的员工个人资料', tl: 'Mangyaring piliin ang iyong profile ng empleyado' },
  enterPin: { en: 'Enter PIN to login', id: 'Masukkan PIN untuk masuk', es: 'Ingrese el PIN para iniciar sesión', zh: '输入PIN码登录', tl: 'Ilagay ang PIN para mag-login' },
  wrongPin: { en: 'Incorrect PIN', id: 'PIN Salah', es: 'PIN incorrecto', zh: 'PIN码错误', tl: 'Maling PIN' },

  // Dashboard
  hi: { en: 'Hi', id: 'Halo', es: 'Hola', zh: '你好', tl: 'Kumusta' },
  readySales: { en: 'Ready for today\'s sales?', id: 'Siap untuk penjualan hari ini?', es: '¿Listo para las ventas de hoy?', zh: '准备好今天的销售了吗？', tl: 'Handa na ba para sa mga benta ngayong araw?' },
  statsSubtitle: { en: 'Stats overview for', id: 'Ikhtisar statistik untuk', es: 'Resumen de estadísticas para', zh: '统计概览', tl: 'Pangkalahatang-ideya ng istatistika para sa' },
  totalSales: { en: 'Total Sales', id: 'Total Penjualan', es: 'Ventas Totales', zh: '总销售额', tl: 'Kabuuang Benta' },
  salesByType: { en: 'Sales by Type', id: 'Penjualan per Tipe', es: 'Ventas por Tipo', zh: '按类型销售', tl: 'Benta ayon sa Uri' },
  recentTransactions: { en: 'Recent Transactions', id: 'Transaksi Terbaru', es: 'Transacciones Recientes', zh: '最近的交易', tl: 'Mga Kamakailang Transaksyon' },
  noTransactions: { en: 'No transactions for today', id: 'Tidak ada transaksi untuk hari ini', es: 'No hay transacciones para hoy', zh: '今天无交易', tl: 'Walang mga transaksyon para sa araw na ito' },

  // Add Transaction
  addRecord: { en: 'Add Record', id: 'Tambah Data', es: 'Agregar Registro', zh: '添加记录', tl: 'Magdagdag ng Record' },
  editRecord: { en: 'Edit Record', id: 'Ubah Data', es: 'Editar Registro', zh: '编辑记录', tl: 'I-edit ang Record' },
  quantity: { en: 'Quantity', id: 'Jumlah', es: 'Cantidad', zh: '数量', tl: 'Dami' },
  weight: { en: 'Weight (g)', id: 'Berat (g)', es: 'Peso (g)', zh: '重量 (g)', tl: 'Timbang (g)' },
  totalPrice: { en: 'Total Price (Rp)', id: 'Total Harga (Rp)', es: 'Precio Total (Rp)', zh: '总价 (Rp)', tl: 'Kabuuang Presyo (Rp)' },
  customerName: { en: 'Customer Name', id: 'Nama Pelanggan', es: 'Nombre del Cliente', zh: '客户名称', tl: 'Pangalan ng Customer' },
  notes: { en: 'Notes (Optional)', id: 'Catatan (Opsional)', es: 'Notas (Opcional)', zh: '备注 (可选)', tl: 'Mga Tala (Opsyonal)' },
  notesPlaceholder: { en: 'Any special requests or details...', id: 'Permintaan atau detail khusus...', es: 'Cualquier petición o detalle especial...', zh: '任何特殊要求或细节...', tl: 'Anumang espesyal na kahilingan o detalye...' },
  walkIn: { en: 'Walk-in', id: 'Pelanggan Langsung', es: 'Cliente directo', zh: '零售客户', tl: 'Walk-in' },

  // Category Detail
  records: { en: 'Records', id: 'Data', es: 'Registros', zh: '记录', tl: 'Mga Record' },
  confirmDelete: { en: 'Delete this record?', id: 'Hapus data ini?', es: '¿Eliminar este registro?', zh: '删除此记录？', tl: 'I-delete ang record na ito?' },

  // Settings
  settings: { en: 'Settings', id: 'Pengaturan', es: 'Ajustes', zh: '设置', tl: 'Mga Setting' },
  manageEmployees: { en: 'Manage employees & preferences', id: 'Kelola karyawan & preferensi', es: 'Administrar empleados y preferencias', zh: '管理员工和偏好', tl: 'Pamahalaan ang mga empleyado at kagustuhan' },
  currentAccount: { en: 'Current Account', id: 'Akun Saat Ini', es: 'Cuenta Actual', zh: '当前账户', tl: 'Kasalukuyang Account' },
  employeeList: { en: 'Employee List', id: 'Daftar Karyawan', es: 'Lista de Empleados', zh: '员工名单', tl: 'Listahan ng Empleado' },
  language: { en: 'Language', id: 'Bahasa', es: 'Idioma', zh: '语言', tl: 'Wika' },
  screenAdaptation: { en: 'Screen Adaptation', id: 'Adaptasi Layar', es: 'Adaptación de Pantalla', zh: '屏幕自适应', tl: 'Adaptasyon sa Screen' },
  adaptAuto: { en: 'Auto (Responsive)', id: 'Otomatis (Adaptif)', es: 'Automático (Adaptable)', zh: '自动（自适应）', tl: 'Awtomatiko (Responsive)' },
  adaptPortrait: { en: 'Lock to Portrait', id: 'Kunci Potret', es: 'Bloquear a Retrato', zh: '锁定为纵向', tl: 'I-lock sa Portrait' },
  adaptLandscape: { en: 'Lock to Landscape', id: 'Kunci Lanskap', es: 'Bloquear a Paisaje', zh: '锁定为横向', tl: 'I-lock sa Landscape' },
  responsiveActive: { en: 'Responsive landscape & tablet mode active', id: 'Mode lanskap & tablet responsif aktif', es: 'Modo horizontal y tablet receptivo activo', zh: '响应式横向和平板模式已激活', tl: 'Aktibo ang responsive na landscape at tablet mode' },
  switchAccount: { en: 'Switch employee account?', id: 'Ganti akun karyawan?', es: '¿Cambiar cuenta de empleado?', zh: '切换员工账户？', tl: 'Lumipat ng account ng empleyado?' },
  addNew: { en: 'Add New', id: 'Tambah Baru', es: 'Agregar Nuevo', zh: '新增', tl: 'Magdagdag ng Bago' },

  // Navigation
  home: { en: 'Home', id: 'Beranda', es: 'Inicio', zh: '首页', tl: 'Home' },
  add: { en: 'Add', id: 'Tambah', es: 'Agregar', zh: '添加', tl: 'Idagdag' },
  settingsNav: { en: 'Settings', id: 'Pengaturan', es: 'Ajustes', zh: '设置', tl: 'Settings' },

  // Languages names
  lang_en: { en: 'English', id: 'Inggris', es: 'Inglés', zh: '英语', tl: 'Ingles' },
  lang_id: { en: 'Indonesian', id: 'Indonesia', es: 'Indonesio', zh: '印度尼西亚语', tl: 'Indonesian' },
  lang_es: { en: 'Spanish', id: 'Spanyol', es: 'Español', zh: '西班牙语', tl: 'Espanyol' },
  lang_zh: { en: 'Chinese', id: 'Mandarin', es: 'Chino', zh: '中文', tl: 'Tsino' },
  lang_tl: { en: 'Tagalog', id: 'Tagalog', es: 'Tagalo', zh: '塔加洛语', tl: 'Tagalog' },

  // Storage Mode
  storageMode: { en: 'Storage Mode', id: 'Penyimpanan', es: 'Modo de Almacenamiento', zh: '存储模式', tl: 'Storage Mode' },
  localDesc: { en: 'Fast, offline on device.', id: 'Cepat, simpan di perangkat.', es: 'Rápido, sin conexión en el dispositivo.', zh: '快速，在设备上离线。', tl: 'Mabilis, offline sa device.' },
  firestoreDesc: { en: 'Cloud sync, safe everywhere.', id: 'Sinkronisasi cloud, aman di mana saja.', es: 'Sincronización en la nube, seguro en todas partes.', zh: '云同步，随处安全。', tl: 'Cloud sync, ligtas kahit saan.' },
  syncPrompt: { en: 'You have local data. Do you want to sync it to the Cloud? Cancel to keep it local or choose to delete it.', id: 'Anda memiliki data lokal. Apakah Anda ingin menyinkronkan data ini ke Cloud? (Pilih Cancel untuk opsi hapus)', es: 'Tienes datos locales. ¿Quieres sincronizarlos con la nube?', zh: '您有本地数据。是否要将其同步到云端？', tl: 'Mayroon kang lokal na data. Gusto mo bang i-sync ito sa Cloud?' },
  deleteLocalPrompt: { en: 'Do you want to delete local data and start fresh in Cloud?', id: 'Apakah Anda ingin menghapus data lokal dan mulai baru di Cloud?', es: '¿Quieres eliminar los datos locales y empezar de nuevo en la nube?', zh: '您要删除本地数据并在云端重新开始吗？', tl: 'Gusto mo bang tanggalin ang lokal na data at magsimula ng bago sa Cloud?' },

  today: { en: 'Today', id: 'Hari Ini', es: 'Hoy', zh: '今天', tl: 'Ngayon' },
  items: { en: 'items', id: 'item', es: 'artículos', zh: '项目', tl: 'mga item' },
  noRecords: { en: 'No records found for this day.', id: 'Tidak ada data ditemukan untuk hari ini.', es: 'No se encontraron registros para este día.', zh: '今天没有找到记录。', tl: 'Walang nahanap na mga record para sa araw na ito.' },
  qtyLabel: { en: 'Qty', id: 'Jml', es: 'Cant', zh: '数量', tl: 'Dami' },
  weightLabel: { en: 'Weight', id: 'Berat', es: 'Peso', zh: '重量', tl: 'Timbang' },
  enabled: { en: 'Enabled', id: 'Aktif', es: 'Habilitado', zh: '已启用', tl: 'Naka-enable' },
  delete: { en: 'Delete', id: 'Hapus', es: 'Eliminar', zh: '删除', tl: 'I-delete' },
  edit: { en: 'Edit', id: 'Edit', es: 'Editar', zh: '编辑', tl: 'I-edit' },

  // Categories
  cat_sell: { en: 'Sell', id: 'Jual', es: 'Venta', zh: '销售', tl: 'Benta' },
  cat_buyback: { en: 'Buyback', id: 'Beli Balik', es: 'Recompra', zh: '回购', tl: 'Buyback' },
  cat_trade_in: { en: 'Trade In', id: 'Tukar Tambah', es: 'Intercambio', zh: '以旧换新', tl: 'Trade In' },
  cat_reviews: { en: 'Reviews', id: 'Ulasan', es: 'Reseñas', zh: '评论', tl: 'Mga Review' },
  cat_services: { en: 'Services', id: 'Layanan', es: 'Layanan', zh: '服务', tl: 'Mga Serbisyo' },
  cat_cnn: { en: 'CNN', id: 'CNN', es: 'CNN', zh: 'CNN', tl: 'CNN' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'id';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: string) => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
