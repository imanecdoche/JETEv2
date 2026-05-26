import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, Employee } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDialog } from '../contexts/DialogContext';
import { 
  ArrowLeft, User, Mail, Phone, Briefcase, Camera, 
  Calendar, Check, CircleUser, MapPin, Contact, 
  CreditCard, ShieldAlert, X 
} from 'lucide-react';

export default function AccountDetail() {
  const { currentUser, setCurrentUser, firebaseUser } = useApp();
  const { language, t } = useLanguage();
  const { alert } = useDialog();
  const navigate = useNavigate();

  // If there's no current user, default to simple local values just in case
  const user = currentUser || {
    id: 'local_staff',
    name: 'Store Staff',
    role: 'owner',
    email: 'local@jeweltrack.com',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: user.name,
    email: user.email || firebaseUser?.email || '',
    role: user.role || 'owner',
    phone: user.phone || '',
    photoUrl: user.photoUrl || '',
    dob: user.dob || '',
    gender: user.gender || 'Laki-laki',
    address: user.address || '',
    emergencyContact: user.emergencyContact || '',
    identityNo: user.identityNo || '',
    npwp: user.npwp || '',
  });

  const getAge = (dobString?: string) => {
    if (!dobString) return '';
    try {
      const birthDate = new Date(dobString);
      if (isNaN(birthDate.getTime())) return '';
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return ` (${age} ${language === 'id' ? 'Tahun' : 'Years Old'})`;
    } catch {
      return '';
    }
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert({ message: language === 'id' ? 'Nama lengkap wajib diisi.' : 'Full name is required.' });
      return;
    }
    
    // Save updated user to context
    setCurrentUser({
      ...user,
      name: formData.name,
      role: formData.role || 'staff',
      phone: formData.phone,
      photoUrl: formData.photoUrl,
      dob: formData.dob,
      gender: formData.gender,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      identityNo: formData.identityNo,
      npwp: formData.npwp,
    });

    setIsEditing(false);
    alert({ message: language === 'id' ? 'Data akun berhasil diperbarui.' : 'Account details updated successfully.' });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      alert({ message: language === 'id' ? 'Ukuran gambar maksimal 2 MB.' : 'Maximum image size is 2 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const presets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  ];

  return (
    <div className="px-4 py-6 md:p-6 min-h-full">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-800 tracking-tight">
              {language === 'id' ? 'Detail Akun' : 'Account Details'}
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              {language === 'id' ? 'Informasi pribadi & jabatan karyawan' : 'Personal information and employee roles'}
            </p>
          </div>
        </div>

        <div>
          {isEditing ? (
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#b68c5b] text-white rounded-xl text-xs font-bold hover:bg-[#b68c5b]/90 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              {language === 'id' ? 'Simpan' : 'Save'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all active:scale-95"
            >
              {language === 'id' ? 'Ubah Profil' : 'Edit Profile'}
            </button>
          )}
        </div>
      </header>

      <div className="space-y-6 pb-28">
        {/* Main Photo Card */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle gold glow bg */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#b68c5b]/5 blur-[40px] rounded-full -z-10" />

          <div className="relative mb-4 group justify-center">
            {formData.photoUrl ? (
              <img 
                src={formData.photoUrl} 
                alt={formData.name || 'User'} 
                referrerPolicy="no-referrer"
                onClick={() => setIsPreviewOpen(true)}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
              />
            ) : (
              <div 
                onClick={() => setIsPreviewOpen(true)}
                className="w-24 h-24 rounded-full bg-[#b68c5b]/10 flex items-center justify-center text-[#b68c5b] border-4 border-white shadow-md text-3xl font-serif font-semibold cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            
            {isEditing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#b68c5b] text-white flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#b68c5b]/90 active:scale-90 transition-all">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                />
              </label>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-800">{formData.name || 'No Name'}</h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b68c5b]" />
              {formData.role || 'Store Staff'}
            </div>
            <p className="text-xs text-gray-400 mt-1">{formData.email}</p>
          </div>

          {/* Quick Avatar Presets */}
          {isEditing && (
            <div className="mt-4 animate-in fade-in duration-200">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                {language === 'id' ? 'Atau Pilih Preset Foto' : 'Or Select Photo Preset'}
              </p>
              <div className="flex gap-2 justify-center">
                {presets.map((p, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setFormData(prev => ({ ...prev, photoUrl: p }))}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#b68c5b] active:scale-90 transition-all"
                  >
                    <img src={p} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </button>
                ))}
                {formData.photoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold hover:bg-gray-50 active:scale-90 transition-all"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Account particulars fields */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#b68c5b]">
              {language === 'id' ? 'INFORMASI PERSONAL UTAMA' : 'PRIMARY PERSONAL INFO'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full name input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {language === 'id' ? 'Nama Lengkap' : 'Full Name'} *
              </label>
              {isEditing ? (
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Budi Santoso"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                />
              ) : (
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                  {formData.name || '-'}
                </div>
              )}
            </div>

            {/* Email (Disabled always) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                Email ({language === 'id' ? 'Terkunci' : 'Locked'})
              </label>
              <div className="bg-gray-150/10 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-400 flex items-center justify-between cursor-not-allowed">
                <span>{formData.email}</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#b68c5b] bg-[#b68c5b]/10 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              </div>
            </div>

            {/* Phone number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {language === 'id' ? 'Nomor Telepon (HP)' : 'Phone Number'}
              </label>
              {isEditing ? (
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="081234567890"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                />
              ) : (
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                  {formData.phone || '-'}
                </div>
              )}
            </div>

            {/* Role / position */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {language === 'id' ? 'Jabatan / Posisi' : 'Role / Position'}
              </label>
              {isEditing ? (
                <select 
                  value={formData.role}
                  onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                >
                  <option value="owner">Owner / Pemilik</option>
                  <option value="admin">Administrator / Kasir</option>
                  <option value="manager">Manager / Pengelola</option>
                  <option value="staff">Staff / Pramuniaga</option>
                </select>
              ) : (
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 capitalize">
                  {formData.role || '-'}
                </div>
              )}
            </div>

            {/* Date of Birth / Age */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {language === 'id' ? 'Tanggal Lahir' : 'Date of Birth'} {formData.dob && <span className="text-[#b68c5b] font-bold">{getAge(formData.dob)}</span>}
              </label>
              {isEditing ? (
                <input 
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData(p => ({ ...p, dob: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                />
              ) : (
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                  {formData.dob ? `${formData.dob}${getAge(formData.dob)}` : '-'}
                </div>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <CircleUser className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {language === 'id' ? 'Jenis Kelamin' : 'Gender'}
              </label>
              {isEditing ? (
                <select 
                  value={formData.gender}
                  onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              ) : (
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                  {formData.gender || '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Info Particulars */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#b68c5b]">
              {language === 'id' ? 'DETAIL ALAMAT & IDENTITAS RESMI' : 'ADDRESS & IDENTITY DETAILS'}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {language === 'id' ? 'Alamat Rumah Lengkap' : 'Full Home Address'}
              </label>
              {isEditing ? (
                <textarea 
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  placeholder="Jl. Gajah Mada No. 12, Jakarta"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800 resize-none"
                />
              ) : (
                <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {formData.address || '-'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <Contact className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {language === 'id' ? 'Kontak Darurat (Hubungan & No HP)' : 'Emergency Contact'}
                </label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={formData.emergencyContact}
                    onChange={e => setFormData(p => ({ ...p, emergencyContact: e.target.value }))}
                    placeholder="Istri - 081299990000"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                  />
                ) : (
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                    {formData.emergencyContact || '-'}
                  </div>
                )}
              </div>

              {/* KTP / SIM No */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {language === 'id' ? 'Nomor Identitas (ID / KTP / SIM)' : 'Identity Number (ID / KTP / SIM)'}
                </label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={formData.identityNo}
                    onChange={e => setFormData(p => ({ ...p, identityNo: e.target.value }))}
                    placeholder="3171020000000001"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                  />
                ) : (
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                    {formData.identityNo || '-'}
                  </div>
                )}
              </div>

              {/* NPWP */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  NPWP ({language === 'id' ? 'Nomor Pokok Wajib Pajak' : 'Tax ID'})
                </label>
                {isEditing ? (
                  <input 
                    type="text"
                    value={formData.npwp}
                    onChange={e => setFormData(p => ({ ...p, npwp: e.target.value }))}
                    placeholder="01.234.567.8-901.000"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800"
                  />
                ) : (
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700">
                    {formData.npwp || '-'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Photo Preview Modal (Square Aspect) */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className="bg-white rounded-[32px] overflow-hidden max-w-sm w-full shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-250 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header bar on preview */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-850 truncate max-w-[200px]">{formData.name || 'User Profile'}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{formData.role || 'Staff'}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo core container (Strictly Square aspect-square) */}
            <div className="bg-gray-50 aspect-square w-full relative flex items-center justify-center">
              {formData.photoUrl ? (
                <img 
                  src={formData.photoUrl} 
                  alt={formData.name || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#b68c5b]/10 flex flex-col items-center justify-center text-[#b68c5b] p-8 gap-3">
                  <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center text-3xl font-serif font-bold shadow-sm">
                    {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400">
                    {language === 'id' ? 'Tidak ada foto profil terpilih' : 'No custom profile photo'}
                  </span>
                </div>
              )}
            </div>

            {/* Tap outside clue */}
            <div className="p-4 flex flex-col gap-1 text-center bg-gray-50/50 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {language === 'id' ? 'KLIK DI LUAR UNTUK MENUTUP' : 'CLICK OUTSIDE TO CLOSE'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
