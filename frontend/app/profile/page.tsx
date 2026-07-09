"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Camera, ImagePlus, KeyRound, Loader2, Lock, Mail, Phone,
  Trash2, UserCircle2, AlertTriangle, Eye, EyeOff, FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/lib/store";
import { User } from "@/lib/types";
import { authService } from "@/services/api";
import { formatDate, getInitials } from "@/lib/utils";

interface ProfileFormState {
  name: string;
  email: string;
  mobile: string;
  headline: string;
  bio: string;
  profileUrl: string;
  uploadedImage: string;
}

const createProfileForm = (user?: User | null): ProfileFormState => ({
  name: user?.name || "",
  email: user?.email || "",
  mobile: user?.mobile || "",
  headline: (user as any)?.headline || "",
  bio: (user as any)?.bio || "",
  profileUrl: user?.profilePicture && !isDataImage(user.profilePicture) ? user.profilePicture : "",
  uploadedImage: user?.profilePicture && isDataImage(user.profilePicture) ? user.profilePicture : "",
});

type ActiveTab = "profile" | "password" | "danger";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateUser, logout } = useAuthStore();

  const [form, setForm] = useState<ProfileFormState>(() => createProfileForm(user));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeletePw, setShowDeletePw] = useState(false);

  const isGoogleUser = (user as any)?.provider === "google";

  useEffect(() => {
    let active = true;
    authService
      .me()
      .then(({ data }) => {
        if (!active) return;
        const nextUser = data as User;
        updateUser(nextUser);
        setForm(createProfileForm(nextUser));
      })
      .catch(() => toast.error("Failed to load your profile"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [updateUser]);

  const previewImage = useMemo(
    () => form.uploadedImage || form.profileUrl.trim() || user?.profilePicture || "",
    [form.profileUrl, form.uploadedImage, user?.profilePicture]
  );

  const handleProfileSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { data } = await authService.updateProfile({
        name: form.name.trim(),
        mobile: form.mobile.trim() || undefined,
        headline: form.headline.trim() || undefined,
        bio: form.bio.trim() || undefined,
        profilePicture: previewImage || undefined,
      });
      updateUser(data);
      setForm(createProfileForm(data));
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    try {
      const imageData = await compressImage(file, 400, 0.8);
      setForm((c) => ({ ...c, uploadedImage: imageData, profileUrl: "" }));
      toast.success("Profile image ready");
    } catch {
      toast.error("Failed to read image file");
    } finally {
      event.target.value = "";
    }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error("All password fields are required"); return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters"); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match"); return;
    }
    setPwSaving(true);
    try {
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed! Other sessions have been logged out.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast.error('Type "DELETE" to confirm account deletion'); return;
    }
    if (!isGoogleUser && !deletePassword) {
      toast.error("Please enter your password to confirm"); return;
    }
    setDeleting(true);
    try {
      await authService.deleteAccount({ password: isGoogleUser ? undefined : deletePassword });
      toast.success("Account deleted. Goodbye!");
      logout();
      router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Profile">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
        </div>
      </AppShell>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; danger?: boolean, disabled?: boolean }[] = [
    { id: "profile", label: "Profile", icon: UserCircle2 },
    { id: "password", label: "Password", icon: KeyRound },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true, disabled: true }
  ];

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-4xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h2 className="text-3xl font-display font-bold text-white">Account Settings</h2>
          <p className="max-w-2xl text-slate-400">
            Manage your profile, security, and account preferences.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
          {tabs.map((tab) => (
            <div key={tab.id} className={`relative flex flex-1 ${tab.disabled ? "group" : ""}`}>
              <button
                onClick={() => { if (!tab.disabled) setActiveTab(tab.id); }}
                disabled={tab.disabled}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all
                  ${tab.disabled
                    ? "cursor-not-allowed opacity-40 text-slate-600"
                    : tab.danger
                      ? activeTab === tab.id
                        ? "bg-rose-500/15 text-rose-300"
                        : "text-rose-400/70 hover:text-rose-300"
                      : activeTab === tab.id
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
              {tab.disabled && (
                <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2  z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="whitespace-nowrap rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 shadow-xl backdrop-blur-sm">
                    This is not accessible
                  </div>
                  <div className="mx-auto mt-0.5 h-1.5 w-1.5 rotate-45 border-b border-r border-white/10 bg-slate-900/95" />
                </div>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 xl:grid-cols-[300px,minmax(0,1fr)]"
            >
              {/* Avatar card */}
              <div className="rounded-[2rem] border border-white/8 p-6 glass-card">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImage} alt={form.name || "Profile"} className="h-28 w-28 rounded-[2rem] border border-white/10 object-cover shadow-xl shadow-black/30" />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-500 via-cyan-500 to-emerald-500 text-3xl font-bold text-white shadow-xl shadow-cyan-500/10">
                        {getInitials(form.name || user?.name || "User")}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950/90 text-slate-200 transition-colors hover:bg-slate-900"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="mt-4 text-xl font-display font-semibold text-white">{form.name || "Your profile"}</h3>
                  <p className="mt-1 text-sm text-slate-400">{form.email}</p>
                  {(user as any)?.createdAt && <p className="mt-2 text-xs text-slate-500">Member since {formatDate((user as any).createdAt)}</p>}
                </div>

                {/* Image upload */}
                <div className="mt-6 space-y-3">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-500/25 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
                  >
                    <ImagePlus className="h-4 w-4" /> Upload image
                  </button>
                  <input
                    value={form.profileUrl}
                    onChange={(e) => setForm((c) => ({ ...c, profileUrl: e.target.value, uploadedImage: "" }))}
                    placeholder="https://example.com/avatar.png"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50"
                  />
                  {previewImage && (
                    <button onClick={() => setForm((c) => ({ ...c, uploadedImage: "", profileUrl: "" }))} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-2 text-sm text-slate-400 hover:text-slate-200">
                      <Trash2 className="h-3.5 w-3.5" /> Remove image
                    </button>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="rounded-[2rem] border border-white/8 p-6 glass-card space-y-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Edit profile</p>
                  <h3 className="text-2xl font-display font-semibold text-white">Personal details</h3>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
                    <div className="relative">
                      <UserCircle2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Your full name" className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Mobile</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input value={form.mobile} onChange={(e) => setForm((c) => ({ ...c, mobile: e.target.value }))} placeholder="+91 98765 43210" className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50" />
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Email (read-only)</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input value={form.email} readOnly className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-slate-400 outline-none" />
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Headline</label>
                    <input
                      value={form.headline}
                      onChange={(e) => setForm((c) => ({ ...c, headline: e.target.value }))}
                      placeholder="e.g. Full Stack Developer at Google"
                      maxLength={120}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Bio</label>
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm((c) => ({ ...c, bio: e.target.value }))}
                      rows={4}
                      placeholder="Tell us a little about yourself..."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={handleProfileSave} disabled={saving} className="flex min-w-[160px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PASSWORD TAB ── */}
          {activeTab === "password" && (
            <motion.div key="password" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-[2rem] border border-white/8 p-6 glass-card max-w-lg"
            >
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Security</p>
                <h3 className="text-2xl font-display font-semibold text-white">Change Password</h3>
              </div>

              {isGoogleUser ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5 text-sm text-amber-200">
                  <p className="font-medium">Google account</p>
                  <p className="mt-1 text-amber-300/70">You signed in with Google. Password management is handled by your Google account.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm((c) => ({ ...c, currentPassword: e.target.value }))}
                        placeholder="Your current password"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50"
                      />
                      <button onClick={() => setShowCurrent((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showNew ? "text" : "password"}
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((c) => ({ ...c, newPassword: e.target.value }))}
                        placeholder="Min. 6 characters"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50"
                      />
                      <button onClick={() => setShowNew((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Confirm New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm((c) => ({ ...c, confirmPassword: e.target.value }))}
                        placeholder="Repeat new password"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                  {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="text-xs text-rose-400">Passwords do not match</p>
                  )}
                  <button
                    onClick={handlePasswordChange}
                    disabled={pwSaving}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60"
                  >
                    {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Update Password
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── DANGER ZONE TAB ── */}
          {activeTab === "danger" && (
            <motion.div key="danger" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-[2rem] border border-rose-500/20 bg-rose-500/5 p-6 max-w-lg space-y-6"
            >
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-rose-400/70">Danger Zone</p>
                <h3 className="text-2xl font-display font-semibold text-white">Delete Account</h3>
                <p className="mt-2 text-sm text-slate-400">
                  This will permanently delete your account, all resumes, interview history, built resumes, and all other data. <strong className="text-rose-300">This cannot be undone.</strong>
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-2 text-sm text-slate-400">
                <p className="font-medium text-slate-300">What will be deleted:</p>
                {["Your account & profile", "All uploaded resumes", "All analysis results", "All interview sessions", "All built resumes", "All token usage history"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-rose-400/60" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {!isGoogleUser && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Confirm with your password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showDeletePw ? "text" : "password"}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled
                        className="w-full rounded-2xl border border-rose-500/20 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-rose-500/50 opacity-50 cursor-not-allowed"
                      />
                      <button
                        onClick={() => setShowDeletePw((v) => !v)}
                        disabled
                        title="This feature is currently unavailable"
                        style={{ pointerEvents: "none", opacity: 0.5 }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      >
                        {showDeletePw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Type <span className="font-mono text-rose-300">DELETE</span> to confirm
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    disabled
                    className="w-full rounded-2xl border border-rose-500/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-rose-500/50 font-mono opacity-50 cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled
                  title="This feature is currently unavailable"
                  style={{ pointerEvents: "none", opacity: 0.5 }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-sm font-semibold text-white cursor-not-allowed"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Permanently Delete My Account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function isDataImage(value?: string) {
  return Boolean(value?.startsWith("data:image"));
}

function compressImage(file: File, size = 400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
