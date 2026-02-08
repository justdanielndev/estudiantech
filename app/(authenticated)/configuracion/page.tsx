"use client"

const CONFIG_KEY = "user_settings";

import { useState, useEffect, useRef, ChangeEvent } from "react"
import dynamic from "next/dynamic"
const ThemeSyncer = dynamic(() => import("@/components/theme-syncer"), { ssr: false })
import { Bell, BellOff, User, LogOut, Loader } from "lucide-react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { useAppContextState } from "@/hooks/useAppContext"
import { account, storage, isAppwriteConfigured } from "@/lib/appwrite-client"
import { ID, Permission, Role } from "appwrite"
import { isDemoMode } from "@/lib/demo-mode"
import { useI18n } from "@/hooks/useI18n"

const APPWRITE_PFP_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_PFP_BUCKET_ID || 'profile-pictures'

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n()
  const defaultSettings = {
    theme: 'system',
    language: 'es',
    background: 'default',
    customBg: '',
    profileImage: '',
  };
  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    return defaultSettings;
  });
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const [appwritePfpUrl, setAppwritePfpUrl] = useState<string | null>(null);
  const [pfpLoading, setPfpLoading] = useState(false);
  const [appwriteUser, setAppwriteUser] = useState<any>(null);
  const { refreshProfileImage } = useAppContextState();

  const {
    permission,
    isSubscribed,
    isLoading: pushLoading,
    error: pushError,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  useEffect(() => {
    if (!isAppwriteConfigured) return;
    
    const loadAppwriteData = async () => {
      try {
        const user = await account.get();
        setAppwriteUser(user);
        
        const fileId = user.prefs?.profileImageFileId;
        if (fileId) {
          const url = storage.getFilePreview(APPWRITE_PFP_BUCKET_ID, fileId, 200, 200);
          setAppwritePfpUrl(url.toString());
        }
      } catch (e) {
        console.warn('Appwrite user not available:', e);
      }
    };
    loadAppwriteData();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  const handleThemeChange = (theme: string) => {
    setSettings((prev: typeof defaultSettings) => ({ ...prev, theme }));
  };

  const handleLanguageChange = (nextLanguage: 'es' | 'en') => {
    setLanguage(nextLanguage)
    setSettings((prev: typeof defaultSettings) => ({ ...prev, language: nextLanguage }))
  }

  const handlePfpChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (appwriteUser) {
      setPfpLoading(true);
      try {
        const oldFileId = appwriteUser.prefs?.profileImageFileId;
        if (oldFileId) {
          try {
            await storage.deleteFile(APPWRITE_PFP_BUCKET_ID, oldFileId);
          } catch (e) {
          }
        }

        const response = await storage.createFile(
          APPWRITE_PFP_BUCKET_ID,
          ID.unique(),
          file,
          [
            Permission.read(Role.user(appwriteUser.$id)),
            Permission.update(Role.user(appwriteUser.$id)),
            Permission.delete(Role.user(appwriteUser.$id))
          ]
        );

        await account.updatePrefs({ profileImageFileId: response.$id });

        const url = storage.getFilePreview(APPWRITE_PFP_BUCKET_ID, response.$id, 200, 200);
        setAppwritePfpUrl(url.toString());
        setAppwriteUser((prev: any) => ({ ...prev, prefs: { ...prev?.prefs, profileImageFileId: response.$id } }));
        await refreshProfileImage();
      } catch (error) {
        console.error('Failed to upload to Appwrite:', error);
        const reader = new FileReader();
        reader.onload = () => {
          const newSettings = { ...settingsRef.current, profileImage: reader.result as string };
          setSettings(newSettings);
        };
        reader.readAsDataURL(file);
      } finally {
        setPfpLoading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const newSettings = { ...settingsRef.current, profileImage: reader.result as string };
        setSettings(newSettings);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearPfp = async () => {
    if (appwriteUser?.prefs?.profileImageFileId) {
      setPfpLoading(true);
      try {
        await storage.deleteFile(APPWRITE_PFP_BUCKET_ID, appwriteUser.prefs.profileImageFileId);
        await account.updatePrefs({ profileImageFileId: null });
        setAppwritePfpUrl(null);
        setAppwriteUser((prev: any) => ({ ...prev, prefs: { ...prev?.prefs, profileImageFileId: null } }));
        await refreshProfileImage();
      } catch (error) {
        console.error('Failed to delete from Appwrite:', error);
      } finally {
        setPfpLoading(false);
      }
    }
    setSettings((prev: typeof defaultSettings) => ({ ...prev, profileImage: '' }));
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      try {
        await account.deleteSession('current');
      } catch (e) {
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const profileImageUrl = appwritePfpUrl || settings.profileImage;
  const isDemo = isDemoMode();

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <ThemeSyncer theme={settings.theme} />
      <h1 className="text-lg font-semibold text-foreground mb-6">{t('settings.title')}</h1>

      {isDemo && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
          {t('settings.demoModeBanner')}
        </div>
      )}

      <div className="rounded-md border border-border bg-card p-6 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-tag-blue flex items-center justify-center text-white text-3xl font-semibold overflow-hidden relative">
          {pfpLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          )}
          {profileImageUrl ? (
            <img src={profileImageUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <User className="w-12 h-12 opacity-60" />
          )}
        </div>
        {isDemo ? (
          <p className="text-xs text-muted-foreground text-center">{t('settings.demoPhotoDisabled')}</p>
        ) : (
          <>
            <div className="w-full flex gap-2">
              <label className="flex-1 px-3 py-2 rounded text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer text-center">
                <input type="file" accept="image/*" className="hidden" onChange={handlePfpChange} disabled={pfpLoading} />
                {t('settings.uploadPhoto')}
              </label>
              <button
                className="flex-1 px-3 py-2 rounded text-xs font-medium bg-secondary text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                onClick={handleClearPfp}
                disabled={!profileImageUrl || pfpLoading}
              >
                {t('settings.remove')}
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">{t('settings.photoRules')}</p>
          </>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase flex items-center gap-2">
          {t('settings.notifications')}
        </label>
        
        {isDemo ? (
          <p className="text-sm text-muted-foreground">
            {t('settings.notificationsDemoDisabled')}
          </p>
        ) : permission === 'unsupported' ? (
          <p className="text-sm text-muted-foreground">
            {t('settings.notificationsUnsupported')}
          </p>
        ) : permission === 'denied' ? (
          <p className="text-sm text-destructive">
            {t('settings.notificationsDenied')}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              {isSubscribed ? (
                <button
                  onClick={unsubscribe}
                  disabled={pushLoading}
                  className="flex-1 px-3 py-2 rounded text-xs font-medium bg-secondary text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pushLoading ? <Loader className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
                  {t('settings.disable')}
                </button>
              ) : (
                <button
                  onClick={subscribe}
                  disabled={pushLoading}
                  className="flex-1 px-3 py-2 rounded text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pushLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  {t('settings.enableNotifications')}
                </button>
              )}
            </div>
            
            {pushError && (
              <p className="text-xs text-destructive">{pushError}</p>
            )}
            
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase">{t('settings.theme')}</label>
        <div className="flex gap-2">
          {[
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
            { value: 'system', label: t('settings.system') },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                settings.theme === value
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase">{t('settings.language')}</label>
        <div className="flex gap-2">
          {[
            { value: 'es', label: t('settings.spanish') },
            { value: 'en', label: t('settings.english') },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleLanguageChange(value as 'es' | 'en')}
              className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                language === value
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="px-3 py-2 rounded text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2 shadow-sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t('settings.logout')}
        </button>
      </div>
    </div>
  )
}
