"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, Mail, Phone, Trash2, UserCircle2 } from "lucide-react";
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
  profileUrl: string;
  uploadedImage: string;
}

const createProfileForm = (user?: User | null): ProfileFormState => ({
  name: user?.name || "",
  email: user?.email || "",
  mobile: user?.mobile || "",
  profileUrl: user?.profilePicture && !isDataImage(user.profilePicture) ? user.profilePicture : "",
  uploadedImage: user?.profilePicture && isDataImage(user.profilePicture) ? user.profilePicture : "",
});

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateUser } = useAuthStore();

  const [form, setForm] = useState<ProfileFormState>(() => createProfileForm(user));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    authService
      .me()
      .then(({ data }) => {
        if (!active) {
          return;
        }

        const nextUser = data as User;
        updateUser(nextUser);
        setForm(createProfileForm(nextUser));
      })
      .catch(() => toast.error("Failed to load your profile"))
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [updateUser]);

  const previewImage = useMemo(
    () => form.uploadedImage || form.profileUrl.trim() || user?.profilePicture || "",
    [form.profileUrl, form.uploadedImage, user?.profilePicture]
  );

  const handleProfileSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const { data } = await authService.updateProfile({
        name: form.name.trim(),
        mobile: form.mobile.trim() || undefined,
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
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    try {
      const imageData = await readFileAsDataUrl(file);
      setForm((current) => ({
        ...current,
        uploadedImage: imageData,
        profileUrl: "",
      }));
      toast.success("Profile image ready");
    } catch {
      toast.error("Failed to read image file");
    } finally {
      event.target.value = "";
    }
  };

  const clearImage = () => {
    setForm((current) => ({
      ...current,
      uploadedImage: "",
      profileUrl: "",
    }));
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

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h2 className="text-3xl font-display font-bold text-white">Profile</h2>
          <p className="max-w-2xl text-slate-400">
            Manage your identity details in one place. Update your name, mobile number, and profile image without
            leaving the dashboard.
          </p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2rem] border border-white/8 p-6 glass-card"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt={form.name || "Profile"}
                    className="h-32 w-32 rounded-[2rem] border border-white/10 object-cover shadow-xl shadow-black/30"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-500 via-cyan-500 to-emerald-500 text-3xl font-bold text-white shadow-xl shadow-cyan-500/10">
                    {getInitials(form.name || user?.name || "User")}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/90 text-slate-200 transition-colors hover:bg-slate-900"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <h3 className="mt-5 text-2xl font-display font-semibold text-white">{form.name || "Your profile"}</h3>
              <p className="mt-1 text-sm text-slate-400">{form.email}</p>
              {user?.createdAt && <p className="mt-3 text-xs text-slate-500">Member since {formatDate(user.createdAt)}</p>}
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</p>
                <p className="mt-1 text-sm text-slate-300">{form.email}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mobile</p>
                <p className="mt-1 text-sm text-slate-300">{form.mobile || "Not added yet"}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2rem] border border-white/8 p-6 glass-card"
          >
            <div className="mb-6 flex flex-col gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Edit profile</p>
              <h3 className="text-2xl font-display font-semibold text-white">Personal details</h3>
              <p className="text-sm text-slate-400">
                Upload an image or paste a URL. Changes are saved instantly to your account profile.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Your full name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={form.mobile}
                    onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={form.email}
                    readOnly
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-white/8 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-display font-semibold text-white">Profile image</h4>
                  <p className="mt-1 text-sm text-slate-400">Choose a local file or paste a direct image URL.</p>
                </div>
                {previewImage && (
                  <button
                    onClick={clearImage}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr),220px]">
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] border border-dashed border-cyan-500/25 bg-cyan-500/5 px-4 py-5 text-sm text-cyan-100 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Upload image file
                  </button>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Image URL</label>
                    <input
                      value={form.profileUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          profileUrl: event.target.value,
                          uploadedImage: "",
                        }))
                      }
                      placeholder="https://example.com/avatar.png"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-violet-500/50"
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Preview</p>
                  <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-[1.25rem] border border-white/8 bg-white/5 p-4">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewImage} alt="Profile preview" className="max-h-40 rounded-2xl object-cover" />
                    ) : (
                      <p className="text-center text-sm text-slate-500">Your profile image preview will appear here.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}

function isDataImage(value?: string) {
  return Boolean(value?.startsWith("data:image"));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
