import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Lock, MapPin, Store, Camera } from 'lucide-react';
import { updateProfile } from '../store/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'seller', label: 'Become a Seller', icon: Store },
];

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [tab, setTab] = useState('profile');
  const fileRef = useRef();

  // Profile tab state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  // Password tab state
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  // Address tab state
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || '',
  });
  // Seller application state
  const [sellerForm, setSellerForm] = useState({ businessName: user?.businessName || '', sellerBio: user?.sellerBio || '' });

  const avatarUrl = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=dc2626&color=fff`;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await api.put('/users/profile/avatar', formData);
      dispatch(updateProfile.fulfilled({ user: data.user }));
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to update avatar');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateProfile(profileForm));
    if (updateProfile.fulfilled.match(result)) toast.success('Profile updated');
    else toast.error('Update failed');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    try {
      await api.put('/users/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateProfile({ address }));
    if (updateProfile.fulfilled.match(result)) toast.success('Address saved');
    else toast.error('Failed to save address');
  };

  const handleSellerApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/apply-seller', sellerForm);
      toast.success('Seller application submitted! We will review it shortly.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    }
  };

  return (
    <div className="container-app py-8 animate-fade-in">
      <h1 className="section-title mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {/* Avatar */}
          <div className="card p-6 text-center mb-4">
            <div className="relative inline-block">
              <img src={avatarUrl} alt={user?.name} className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-primary-100" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-1.5 hover:bg-primary-700 transition-colors"
              >
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <p className="font-semibold mt-3">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`badge mt-2 inline-block capitalize ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : user?.role === 'seller' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {user?.role}
            </span>
          </div>

          {/* Tabs */}
          <nav className="card overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => {
              if (id === 'seller' && (user?.role === 'seller' || user?.role === 'admin')) return null;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-r-2 border-primary-600'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content */}
        <div className="lg:col-span-3">
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-5">Personal Information</h2>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name</label>
                  <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                  <input className="input" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input className="input opacity-60" value={user?.email} disabled />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {tab === 'password' && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-5">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {[
                  { name: 'currentPassword', label: 'Current Password' },
                  { name: 'newPassword', label: 'New Password' },
                  { name: 'confirmPassword', label: 'Confirm New Password' },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <input
                      type="password"
                      className="input"
                      value={passForm[name]}
                      onChange={(e) => setPassForm({ ...passForm, [name]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <button type="submit" className="btn-primary">Update Password</button>
              </form>
            </div>
          )}

          {tab === 'address' && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-5">Shipping Address</h2>
              <form onSubmit={handleAddressSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Street Address</label>
                  <input className="input" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">City</label>
                    <input className="input" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">State</label>
                    <input className="input" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">ZIP Code</label>
                    <input className="input" value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Country</label>
                    <input className="input" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            </div>
          )}

          {tab === 'seller' && (
            <div className="card p-6">
              <h2 className="font-bold text-lg mb-2">Become a Seller</h2>
              {user?.sellerStatus === 'pending' ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-700 dark:text-amber-400">
                  Your seller application is under review. We'll notify you within 24-48 hours.
                </div>
              ) : user?.sellerStatus === 'rejected' ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 mb-4">
                  Your previous application was rejected. You may reapply.
                </div>
              ) : null}

              {user?.sellerStatus !== 'pending' && (
                <form onSubmit={handleSellerApply} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Business Name</label>
                    <input className="input" value={sellerForm.businessName} onChange={(e) => setSellerForm({ ...sellerForm, businessName: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">About Your Business</label>
                    <textarea className="input min-h-[100px] resize-none" value={sellerForm.sellerBio} onChange={(e) => setSellerForm({ ...sellerForm, sellerBio: e.target.value })} placeholder="Describe what parts you sell..." />
                  </div>
                  <button type="submit" className="btn-primary">Submit Application</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
