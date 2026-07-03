import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Play, X, Edit2, Eye, Sparkles, Image as ImageIcon, Search, Loader2, Trash2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserTier } from "@/hooks/useUserTier";
import { getTierLimits } from "@/lib/featureGating";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { localizeEdgeErrorMessage } from "@/lib/error-utils";
import { isAppLocale, type AppLocale } from "@/lib/locale";
import {
  AFFIRMATION_LINE_MAX_LENGTH,
  AFFIRMATION_SET_NAME_MAX_LENGTH,
  AffirmationSet,
  SUPPORT_CATEGORIES,
  getLocalizedPremadeSets,
  getSupportCategoryLabel,
} from "@/lib/affirmations-data";
import { recordDailyManifestationSignal } from "@/lib/manifestationPowerSignals";
import { STARTER_AFFIRMATION_SET_NAMES } from "@/lib/postPaywallProvisioning";

const Affirmations = () => {
  const { t, i18n } = useTranslation("tools");
  const apiLocale: AppLocale = isAppLocale(i18n.language) ? i18n.language : "en";
  const { t: tCommon } = useTranslation("common");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const isCosmic = theme === "dark";
  const affirmCardClass = cn(
    theme === "dark" ? "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm" : "border border-zinc-200/75 bg-card/75 backdrop-blur-sm",
    theme === "dark" ? "hover:bg-white/8" : "hover:bg-card/90",
    isCosmic && "!bg-transparent",
  );
  const affirmMenuSurface = isCosmic ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "";
  const affirmSectionBorder = isCosmic ? "border-white/12" : "border-primary/10";
  const affirmInsetPanel = isCosmic
    ? "rounded-lg border border-white/12 bg-transparent"
    : "rounded-lg bg-muted/50 border border-primary/10";
  const affirmListRow = isCosmic
    ? "p-2 rounded-lg border border-white/12 bg-transparent text-xs"
    : "p-2 rounded-lg bg-background/50 border border-primary/10 text-xs";
  const affirmReadOnlyRow = isCosmic
    ? "p-2 rounded-lg border border-white/12 bg-transparent text-xs"
    : "p-2 rounded-lg bg-background/30 border border-primary/10 text-xs";
  const { user } = useAuth();
  const { tier, status } = useUserTier();
  const tierLimits = getTierLimits({ tier, status });

  /**
   * Stale-while-revalidate: hydrate user sets from sessionStorage so re-entering the
   * Affirmations page within a session shows the list immediately instead of an empty
   * grid that fills in 300–800ms after the network round-trip.
   */
  const affirmationsCacheKey = user?.id ? `affirmationSets_${user.id}` : null;
  const [sets, setSets] = useState<AffirmationSet[]>(() => {
    if (typeof window === "undefined" || !affirmationsCacheKey) return [...getLocalizedPremadeSets()];
    try {
      const raw = sessionStorage.getItem(affirmationsCacheKey);
      if (!raw) return [...getLocalizedPremadeSets()];
      const cachedUserSets = JSON.parse(raw) as AffirmationSet[];
      if (!Array.isArray(cachedUserSets)) return [...getLocalizedPremadeSets()];
      return [...getLocalizedPremadeSets(), ...cachedUserSets];
    } catch {
      return [...getLocalizedPremadeSets()];
    }
  });
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetCategory, setNewSetCategory] = useState<string>("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [currentSet, setCurrentSet] = useState<AffirmationSet | null>(null);
  const [newAffirmation, setNewAffirmation] = useState("");
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [viewingSetId, setViewingSetId] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSetId, setImageSetId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; url: string; thumb?: string; description?: string; category?: string }>>([]);
  const [allLibraryImages, setAllLibraryImages] = useState<Array<{ id: string; url: string; thumb?: string; description?: string; category?: string }>>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);
  const [weeklyAIGenerations, setWeeklyAIGenerations] = useState<number>(0);
  const [isLoadingAICount, setIsLoadingAICount] = useState(true);
  const [visibleImageCount, setVisibleImageCount] = useState(12);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = t("affirmations.pageTitle");
    return () => {
      document.title = prevTitle;
    };
  }, [t]);

  useEffect(() => {
    setSets((prev) => {
      const userSets = prev.filter((s) => !s.isPremade);
      return [...getLocalizedPremadeSets(), ...userSets];
    });
  }, [i18n.resolvedLanguage]);

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadAffirmationSets();
    loadWeeklyAICount();
  }, [user]);

  useEffect(() => {
    // Load categories when image section is opened
    if (imageSetId && availableCategories.length === 0 && allLibraryImages.length === 0) {
      loadImageLibrary(null, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSetId]);

  const loadWeeklyAICount = async () => {
    if (!user) {
      setWeeklyAIGenerations(0);
      setIsLoadingAICount(false);
      return;
    }

    try {
      setIsLoadingAICount(true);
      const { data, error } = await (supabase as any).rpc('get_weekly_ai_affirmation_count', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error loading weekly AI count:', error);
        setWeeklyAIGenerations(0);
      } else {
        setWeeklyAIGenerations(typeof data === 'number' ? data : 0);
      }
    } catch (error) {
      console.error('Error loading weekly AI count:', error);
      setWeeklyAIGenerations(0);
    } finally {
      setIsLoadingAICount(false);
    }
  };

  const loadAffirmationSets = async () => {
    if (!user) {
      // User must be logged in - show only premade sets
      setSets([...getLocalizedPremadeSets()]);
      return;
    }

    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        if (import.meta.env.DEV) {
          console.warn('No valid session found, showing only premade sets');
        }
        setSets([...getLocalizedPremadeSets()]);
        return;
      }

      // Load user sets from database - RLS will automatically filter by auth.uid() = user_id
      // Don't filter by user_id manually - let RLS handle it for security
      const { data: dbSets, error: dbError } = await (supabase as any)
        .from('user_affirmation_sets')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        // Check if it's an RLS policy error
        if (dbError.message?.includes('row-level security') || dbError.message?.includes('RLS') || dbError.code === '42501' || dbError.code === 'PGRST301') {
          console.error('Please ensure you are logged in and try again.');
        }
        console.error("Error loading from database:", dbError);
        toast.error(t("affirmations.toasts.loadFailed"));
        // Show only premade sets on error
        setSets([...getLocalizedPremadeSets()]);
        return;
      }

      // Always include premade sets
      let allSets = [...getLocalizedPremadeSets()];
      let userSetsForCache: AffirmationSet[] = [];

      if (dbSets && dbSets.length > 0) {
        // Convert database sets to AffirmationSet format
        const userSets: AffirmationSet[] = dbSets.map(dbSet => ({
          id: dbSet.id,
          name: dbSet.name,
          affirmations: dbSet.affirmations as string[],
          images: dbSet.images as any[],
          isPremade: false,
          category: dbSet.category || undefined,
        }));
        allSets = [...getLocalizedPremadeSets(), ...userSets];
        userSetsForCache = userSets;
      }

      setSets(allSets);

      if (typeof window !== "undefined" && user?.id) {
        try {
          sessionStorage.setItem(
            `affirmationSets_${user.id}`,
            JSON.stringify(userSetsForCache),
          );
        } catch {
          /* sessionStorage may be unavailable in some PWA contexts */
        }
      }
    } catch (error) {
      console.error("Error loading affirmation sets:", error);
      toast.error(t("affirmations.toasts.loadFailed"));
      // Show only premade sets on error
      setSets([...getLocalizedPremadeSets()]);
    }
  };

  const saveSets = async (updatedSets: AffirmationSet[]) => {
    setSets(updatedSets);
    
    try {
      // Refresh session to ensure auth.uid() works correctly in RLS
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession || !freshSession.access_token) {
        toast.error(t("affirmations.toasts.noSession"));
        return;
      }

      const sessionUserId = freshSession.user.id;
      
      // Separate premade and user sets
      const premadeSets = updatedSets.filter(s => s.isPremade);
      const userSets = updatedSets.filter(s => !s.isPremade);
      
      // Save user sets to database
      // First, get existing sets from database - RLS will automatically filter by auth.uid() = user_id
      const { data: existingDbSets, error: fetchError } = await (supabase as any)
        .from('user_affirmation_sets')
        .select('id');
      
      if (fetchError) {
        // Check if it's an RLS policy error
        if (fetchError.message?.includes('row-level security') || fetchError.message?.includes('RLS') || fetchError.code === '42501' || fetchError.code === 'PGRST301') {
          console.error('RLS Policy Violation:', fetchError);
          toast.error(t("affirmations.toasts.permissionDenied"));
          return;
        }
        throw fetchError;
      }
      
      const existingIds = new Set(existingDbSets?.map((s: any) => s.id) || []);
      
      // Update or insert each user set
      for (const set of userSets) {
        if (existingIds.has(set.id)) {
          // Update existing - RLS will ensure user can only update their own sets
          const { error: updateError } = await (supabase as any)
            .from('user_affirmation_sets')
            .update({
              name: set.name,
              affirmations: set.affirmations,
              images: set.images,
              category: set.category || null,
            })
            .eq('id', set.id);
          
          if (updateError) {
            // Check if it's an RLS policy error
            if (updateError.message?.includes('row-level security') || updateError.message?.includes('RLS') || updateError.code === '42501' || updateError.code === 'PGRST301') {
              console.error('RLS Policy Violation on update:', updateError);
              toast.error(t("affirmations.toasts.permissionDenied"));
              return;
            }
            // Check if it's a column doesn't exist error (migration not run)
            if (updateError.message?.includes('column') && updateError.message?.includes('does not exist')) {
              console.error("Category column doesn't exist - migration may not have run:", updateError);
              toast.error(t("affirmations.toasts.migrationNeeded"));
              return;
            }
            console.error("Error updating set:", updateError);
            toast.error(t("affirmations.toasts.updateFailed", { message: updateError.message || t("affirmations.toasts.unknownError") }));
            return;
          }
        } else {
          // Insert new - use session user ID to match auth.uid() for RLS
          const { error: insertError } = await (supabase as any)
            .from('user_affirmation_sets')
            .insert({
              id: set.id,
              user_id: sessionUserId, // Use session user ID to match auth.uid()
              name: set.name,
              affirmations: set.affirmations,
              images: set.images,
              category: set.category || null,
            });
          
          if (insertError) {
            // Check if it's an RLS policy error
            if (insertError.message?.includes('row-level security') || insertError.message?.includes('RLS') || insertError.code === '42501' || insertError.code === 'PGRST301') {
              console.error('RLS Policy Violation on insert:', {
                code: insertError.code,
                message: insertError.message,
                sessionUserId,
                contextUserId: user?.id,
              });
              toast.error(t("affirmations.toasts.permissionDenied"));
              return;
            }
            // Check if it's a column doesn't exist error (migration not run)
            if (insertError.message?.includes('column') && insertError.message?.includes('does not exist')) {
              console.error("Category column doesn't exist - migration may not have run:", insertError);
              toast.error(t("affirmations.toasts.migrationNeeded"));
              return;
            }
            console.error("Error inserting set:", insertError);
            toast.error(t("affirmations.toasts.createFailed", { message: insertError.message || t("affirmations.toasts.unknownError") }));
            return;
          }
        }
      }
      
      // Delete sets that are no longer in the list - RLS will ensure user can only delete their own sets
      const currentIds = new Set(userSets.map(s => s.id));
      const toDelete = existingDbSets?.filter((s: any) => !currentIds.has(s.id)) || [];
      
      if (toDelete.length > 0) {
        const { error: deleteError } = await (supabase as any)
          .from('user_affirmation_sets')
          .delete()
          .in('id', toDelete.map((s: any) => s.id));
        
        if (deleteError) {
          // Check if it's an RLS policy error
          if (deleteError.message?.includes('row-level security') || deleteError.message?.includes('RLS') || deleteError.code === '42501' || deleteError.code === 'PGRST301') {
            console.error('RLS Policy Violation on delete:', deleteError);
            toast.error(t("affirmations.toasts.permissionDenied"));
            return;
          }
          console.error("Error deleting sets:", deleteError);
        }
      }
      
    } catch (error: any) {
      console.error("Error saving sets:", error);
      toast.error(error.message || t("affirmations.toasts.saveFailed"));
    }
  };

  // Load all images from library manifest (cached to avoid re-fetching)
  const loadImageLibrary = async (categoryToApply?: string | null, loadCategoriesOnly: boolean = false) => {
    // If images are already loaded, just apply filters - don't re-fetch
    if (allLibraryImages.length > 0) {
      if (categoryToApply) {
        applyImageFilters(allLibraryImages, categoryToApply);
      } else if (!selectedCategory) {
        setSearchResults([]);
      }
      return;
    }

    try {
      // Only show loading spinner if we're actually loading images to display
      if (!loadCategoriesOnly) {
        setIsSearching(true);
      }
      
      // Fetch with cache control to use browser cache
      const response = await fetch('/affirmationimagelibrary/manifest.json', {
        cache: 'force-cache' // Use browser cache if available
      });
      if (!response.ok) {
        throw new Error(t("affirmations.toasts.manifestLoadFailed"));
      }

      const manifest = await response.json();
      
      // Map all images
      const allImages = manifest.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        thumb: img.url,
        description: img.description || '',
        category: img.category || 'Uncategorized',
      }));

      setAllLibraryImages(allImages);
      
      // Extract unique categories
      const categories = Array.from(new Set(allImages.map((img: any) => img.category).filter(Boolean))).sort() as string[];
      setAvailableCategories(categories);
      
      // If just loading categories, don't apply filters yet
      if (loadCategoriesOnly) {
        return;
      }
      
      // If a category was requested, apply it; otherwise keep empty until user selects
      if (categoryToApply) {
        applyImageFilters(allImages, categoryToApply);
      } else {
        setSearchResults([]);
      }
      
    } catch (error) {
      console.error('Error loading image library:', error);
      toast.error(t("affirmations.toasts.imageLibraryFailed"));
    } finally {
      setIsSearching(false);
    }
  };

  // Apply category filter only
  const applyImageFilters = (images: Array<{ id: string; url: string; thumb?: string; description?: string; category?: string }>, category: string | null) => {
    if (!category) {
      setSearchResults([]);
      return;
    }

    const filtered = images.filter(img => img.category === category);
    setSearchResults(filtered);
  };

  // Handle category selection
  const handleCategorySelect = async (category: string | null) => {
    setSelectedCategory(category);
    setVisibleImageCount(12); // Reset visible count when changing category
    if (!category) {
      setSearchResults([]);
      return;
    }

    if (allLibraryImages.length === 0) {
      await loadImageLibrary(category);
    } else {
      applyImageFilters(allLibraryImages, category);
    }
  };

  const toggleImageSelection = (image: { id: string; url: string; thumb?: string; description?: string }, maxImages: number) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(image.id)) {
      newSelected.delete(image.id);
    } else {
      if (newSelected.size >= maxImages) {
        toast.error(t("affirmations.toasts.maxImages", { count: maxImages, max: maxImages }));
        return;
      }
      newSelected.add(image.id);
    }
    setSelectedImages(newSelected);
  };

  const addSelectedImages = async () => {
    if (!imageSetId) return;

    const selectedImagesData = searchResults
      .filter(img => selectedImages.has(img.id))
      .map(img => ({
        id: img.id,
        url: img.url
      }));

    const updatedSets = sets.map(s => 
      s.id === imageSetId 
        ? { ...s, images: [...(s.images || []), ...selectedImagesData] }
        : s
    );
    
    await saveSets(updatedSets);
    setSelectedImages(new Set());
    setSearchResults([]);
    toast.success(t("affirmations.toasts.imagesAdded", { count: selectedImagesData.length }));
  };


  const removeImage = async (setId: string, imageId: string) => {
    const updatedSets = sets.map(s => 
      s.id === setId 
        ? { ...s, images: s.images?.filter(img => img.id !== imageId) }
        : s
    );
    
    await saveSets(updatedSets);
    toast.success(t("affirmations.toasts.imageRemoved"));
  };

  const createNewSet = async () => {
    if (!newSetName.trim()) {
      toast.error(t("affirmations.toasts.enterSetName"));
      return;
    }

    if (!newSetCategory) {
      toast.error(t("affirmations.toasts.selectCategory"));
      return;
    }

    // Check affirmation set limit
    const userSets = sets.filter(s => !s.isPremade);
    if (userSets.length >= tierLimits.affirmationSetLimit) {
      toast.error(t("affirmations.toasts.setLimitReached", { limit: tierLimits.affirmationSetLimit }));
      return;
    }

    const newSet: AffirmationSet = {
      id: crypto.randomUUID(),
      name: newSetName.trim(),
      affirmations: [],
      images: [],
      isPremade: false,
      category: newSetCategory
    };

    // If AI is enabled, generate affirmations
    if (useAI) {
      // Check weekly AI generation limit
      if (weeklyAIGenerations >= tierLimits.aiAffirmationGenerationsPerWeek) {
        toast.error(t("affirmations.toasts.weeklyLimitUpgrade", { limit: tierLimits.aiAffirmationGenerationsPerWeek }));
        return;
      }

      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-affirmations', {
          body: { topic: newSetName.trim(), category: newSetCategory, locale: apiLocale },
        });

        // Check for error in data first (Edge Function returns error in body on 500)
        if (data?.error) {
          // Check if user is blocked (403 error)
          if (data.blocked) {
            const errorMsg = data.error || t("affirmations.toasts.blockedDefault");
            toast.error(
              <div>
                {errorMsg}
                <br />
                <a href="/terms" className="underline mt-2 inline-block">{t("affirmations.viewTerms")}</a>
              </div>,
              { duration: 10000 }
            );
            setIsGenerating(false);
            return;
          }

          console.error('Function returned error:', data.error);
          toast.error(localizeEdgeErrorMessage(typeof data.error === "string" ? data.error : String(data.error), tCommon));
          setIsGenerating(false);
          return;
        }

        if (error) {
          console.error('Supabase function error:', error);
          console.error('Full error details:', JSON.stringify(error, null, 2));
          
          let errorMsg = error.message || t("affirmations.toasts.connectFailed");
          
          if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
            errorMsg = t("affirmations.toasts.rateLimit");
          } else if (error.message?.includes('402') || error.message?.includes('credits')) {
            errorMsg = t("affirmations.toasts.creditsDepleted");
          } else if (error.message?.includes('Function not found') || error.message?.includes('404')) {
            errorMsg = t("affirmations.toasts.genericError");
          } else if (error.message?.includes('Failed to send') || error.message?.includes('network')) {
            errorMsg = t("affirmations.toasts.genericError");
          } else if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
            // 500 error - likely missing key or function error
            errorMsg = t("affirmations.toasts.genericError");
          }
          
          toast.error(errorMsg);
          setIsGenerating(false);
          return;
        }

        if (!data || !data.affirmations || !Array.isArray(data.affirmations) || data.affirmations.length === 0) {
          console.error('Invalid response data:', data);
          toast.error(t("affirmations.toasts.noAffirmationsReceived"));
          setIsGenerating(false);
          return;
        }

        newSet.affirmations = data.affirmations;
        toast.success(t("affirmations.toasts.generatedCount", { count: newSet.affirmations.length }));
      } catch (error: any) {
        console.error('Error generating affirmations:', error);
        console.error('Full error:', JSON.stringify(error, null, 2));
        const errorMsg = localizeEdgeErrorMessage(
          error?.message || t("affirmations.toasts.unknownError"),
          tCommon,
        );
        toast.error(t("affirmations.toasts.generateFailed", { message: errorMsg }));
      } finally {
        setIsGenerating(false);
      }
    }

    const updatedSets = [...sets, newSet];
    
    // Save sets first to get the database ID
    await saveSets(updatedSets);
    
    // Log successful AI generation after set is saved (so we have the actual set_id)
    if (useAI && user) {
      try {
        // Get the saved set from database to get the actual ID
        const { data: { session: freshSession } } = await supabase.auth.getSession();
        if (freshSession) {
          const { data: savedSets } = await (supabase as any)
            .from('user_affirmation_sets')
            .select('id, name')
            .eq('name', newSet.name)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (savedSets && savedSets.id) {
            const { error: logError } = await (supabase as any)
              .from('ai_affirmation_generation_log')
              .insert({
                user_id: user.id,
                set_id: savedSets.id,
                generated_at: new Date().toISOString()
              });

            if (logError) {
              console.error('Error logging AI generation:', logError);
              // Don't block the user if logging fails
            } else {
              // Reload weekly count after successful generation
              await loadWeeklyAICount();
            }
          }
        }
      } catch (logErr) {
        console.error('Error logging AI generation:', logErr);
        // Don't block the user if logging fails
      }
    }
    
    setCurrentSet(newSet);
    setNewSetName("");
    setNewSetCategory("");
    setUseAI(false);
    setIsCreatingSet(false);
    
    if (!useAI) {
      toast.success(t("affirmations.toasts.setCreated"));
    }
  };


  const addAffirmation = () => {
    if (!currentSet) return;
    if (!newAffirmation.trim()) {
      toast.error(t("affirmations.toasts.enterAffirmation"));
      return;
    }
    if (currentSet.affirmations.length >= 10) {
      toast.error(t("affirmations.toasts.maxAffirmations"));
      return;
    }

    const updatedSet = {
      ...currentSet,
      affirmations: [
        ...currentSet.affirmations,
        newAffirmation.trim().slice(0, AFFIRMATION_LINE_MAX_LENGTH),
      ],
    };

    const updatedSets = sets.map(s => s.id === currentSet.id ? updatedSet : s);
    saveSets(updatedSets);
    setCurrentSet(updatedSet);
    setNewAffirmation("");
    toast.success(t("affirmations.toasts.affirmationAdded"));
  };

  const removeAffirmation = (index: number) => {
    if (!currentSet) return;

    const updatedSet = {
      ...currentSet,
      affirmations: currentSet.affirmations.filter((_, i) => i !== index)
    };

    const updatedSets = sets.map(s => s.id === currentSet.id ? updatedSet : s);
    saveSets(updatedSets);
    setCurrentSet(updatedSet);
    toast.success(t("affirmations.toasts.affirmationRemoved"));
  };

  const deleteSet = (setId: string) => {
    const setToDelete = sets.find(s => s.id === setId);
    if (setToDelete?.isPremade) {
      toast.error(t("affirmations.toasts.cannotDeletePremade"));
      return;
    }

    const updatedSets = sets.filter(s => s.id !== setId);
    saveSets(updatedSets);
    if (currentSet?.id === setId) {
      setCurrentSet(null);
    }
    setDeleteConfirmOpen(false);
    setSetToDelete(null);
    toast.success(t("affirmations.toasts.setDeleted"));
  };

  const loadAffirmations = (set: AffirmationSet) => {
    if (set.affirmations.length === 0) {
      toast.error(t("affirmations.toasts.noAffirmationsInSet"));
      return;
    }
    void recordDailyManifestationSignal("affirm_visualize");
    navigate(`/dashboard/affirmation-viewer/${set.id}`);
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {/* Desktop Sidebar - Only on desktop */}
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}
      
      {/* Main Content - Offset for sidebar on desktop */}
      <div 
        className="min-h-screen"
        style={!isMobile ? {
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 300ms ease-in-out'
        } : {}}
      >
      {/* Safe area: theme background (not hardcoded white). */}
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}
      {/* Header */}
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between", !isMobile ? "" : "container mx-auto")}>
          <h1 
            className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
            onClick={() => navigate("/dashboard")}
          >
            {t("affirmations.title")}
          </h1>
          {isMobile && <MobilePWAMenu />}
        </div>
      </header>

      <main className={cn("px-4 sm:px-6 max-w-6xl pb-24 md:pb-8 relative z-10", !isMobile ? "pt-16" : "", !isMobile ? "" : "container mx-auto")}>
        <div className="py-3 sm:py-4">
          <p className={cn("text-sm mb-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
            {t("affirmations.subtitle")}
          </p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">{t("affirmations.yourCustomSets")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("affirmations.storingSets", { current: sets.filter(s => !s.isPremade).length, limit: tierLimits.affirmationSetLimit })}
              </p>
            </div>
            <Dialog open={isCreatingSet} onOpenChange={setIsCreatingSet} modal={true}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn("shrink-0", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                  disabled={sets.filter(s => !s.isPremade).length >= tierLimits.affirmationSetLimit}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("affirmations.newSet")}
                </Button>
              </DialogTrigger>
              <DialogContent
                className={cn(
                  "z-50 max-w-[90vw] sm:max-w-md shadow-lg",
                  isCosmic ? "border border-white/12 bg-[#0f0d14] text-white" : "border-0",
                )}
              >
                <DialogHeader>
                  <DialogTitle>{t("affirmations.createNewSet")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                  <Input
                    placeholder={t("affirmations.setNamePlaceholder")}
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isGenerating && createNewSet()}
                    maxLength={AFFIRMATION_SET_NAME_MAX_LENGTH}
                    autoFocus
                    className={theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : ""}
                  />
                    </div>
                    <div className="flex-1">
                      <Select value={newSetCategory} onValueChange={setNewSetCategory}>
                        <SelectTrigger
                          className={cn("h-10", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                          style={
                            newSetCategory
                              ? {
                                  backgroundColor: `${SUPPORT_CATEGORIES.find(c => c.name === newSetCategory)?.color}20`,
                                  color: SUPPORT_CATEGORIES.find(c => c.name === newSetCategory)?.color,
                                }
                              : {}
                          }
                        >
                          <SelectValue placeholder={t("affirmations.selectCategory")} />
                        </SelectTrigger>
                        <SelectContent className={cn("max-h-[300px]", affirmMenuSurface)}>
                          {SUPPORT_CATEGORIES.map((category) => (
                            <SelectItem 
                              key={category.name} 
                              value={category.name}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 py-1">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-foreground">{getSupportCategoryLabel(category.name)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className={cn("flex items-center gap-3 p-3", affirmInsetPanel)}>
                    <div className="flex items-center gap-2 flex-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{t("affirmations.generateAffirmations")}</span>
                      {isLoadingAICount ? (
                        <span className="text-xs text-muted-foreground ml-2">{t("affirmations.loading")}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground ml-2">
                          {t("affirmations.weeklyCount", {
                            current: weeklyAIGenerations,
                            limit: tierLimits.aiAffirmationGenerationsPerWeek,
                          })}
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={useAI}
                      disabled={weeklyAIGenerations >= tierLimits.aiAffirmationGenerationsPerWeek}
                      className={theme === "dark" ? cn("border-2 border-white/12 !bg-transparent", "data-[state=checked]:!border-white/30 data-[state=checked]:!bg-white/10", "data-[state=unchecked]:!bg-transparent", "[&>span]:!bg-white/90 [&>span]:shadow-none") : ""}
                      onCheckedChange={(checked) => {
                        const isAtLimit =
                          weeklyAIGenerations >= tierLimits.aiAffirmationGenerationsPerWeek;
                        if (checked && isAtLimit) {
                          toast.error(
                            t("affirmations.toasts.weeklyLimit", { limit: tierLimits.aiAffirmationGenerationsPerWeek }),
                          );
                          return;
                        }
                        setUseAI(checked);
                      }}
                      aria-label={t("affirmations.generateAffirmationsAria")}
                    />
                  </div>

                  {useAI && (
                    <p className="text-xs text-muted-foreground">
                      {t("affirmations.generateHint")}
                    </p>
                  )}
                  
                  {useAI && weeklyAIGenerations >= tierLimits.aiAffirmationGenerationsPerWeek && (
                    <div className={cn("p-3", affirmInsetPanel)}>
                      <p className="text-xs text-foreground">
                        {t("affirmations.weeklyLimitReached", { limit: tierLimits.aiAffirmationGenerationsPerWeek })}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={createNewSet}
                    className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                    disabled={isGenerating || (useAI && weeklyAIGenerations >= tierLimits.aiAffirmationGenerationsPerWeek)}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t("affirmations.generating")}
                      </>
                    ) : (
                      useAI ? t("affirmations.generateSet") : t("affirmations.createSet")
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* User Created Sets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {sets.filter(s => !s.isPremade).length === 0 ? (
            <Card className={cn("overflow-hidden rounded-xl shadow-sm transition-colors", affirmCardClass)}>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t("affirmations.noCustomSets")}
                </p>
              </CardContent>
            </Card>
          ) : (
            sets.filter(s => !s.isPremade).map(set => (
              <Card
                key={set.id}
                className={cn("overflow-hidden rounded-xl shadow-sm transition-colors", affirmCardClass)}
              >
                <CardContent className="p-4">
                  <div className="relative">
                    <div className="min-w-0 pr-[9.25rem]">
                      <h3 className="font-semibold mb-1">
                        {STARTER_AFFIRMATION_SET_NAMES.includes(set.name) ? t("affirmations.starterSetName") : set.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {t("affirmations.affirmationCount", { count: set.affirmations.length })}
                      </p>
                        {set.category && (() => {
                          const categoryInfo = SUPPORT_CATEGORIES.find(c => c.name === set.category);
                          return categoryInfo ? (
                            <Badge 
                              variant="outline" 
                              className="text-xs whitespace-nowrap"
                              style={{
                                borderColor: categoryInfo.color + "80",
                                backgroundColor: categoryInfo.color + "20",
                                color: categoryInfo.color,
                              }}
                            >
                              {getSupportCategoryLabel(set.category)}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="absolute right-0 top-0 flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={editingSetId === set.id ? "default" : "ghost"}
                        onClick={() => {
                          if (editingSetId === set.id) {
                            // Closing edit
                            setEditingSetId(null);
                          } else {
                            // Opening edit - close images first
                            setImageSetId(null);
                            setSearchResults([]);
                            setSelectedImages(new Set());
                            setSelectedCategory(null);
                            setVisibleImageCount(12);
                            setEditingSetId(set.id);
                          }
                        }}
                        title={t("affirmations.editSet")}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={imageSetId === set.id ? "default" : "ghost"}
                        onClick={() => {
                          if (imageSetId === set.id) {
                            // Closing images
                            setImageSetId(null);
                            setSearchResults([]);
                            setSelectedImages(new Set());
                            setSelectedCategory(null);
                            setVisibleImageCount(12);
                          } else {
                            // Opening images - close edit first
                            setEditingSetId(null);
                            setImageSetId(set.id);
                            setSearchResults([]);
                            setSelectedImages(new Set());
                            setSelectedCategory(null);
                            setVisibleImageCount(12);
                          }
                        }}
                        title={imageSetId === set.id ? t("affirmations.closeImages") : t("affirmations.addImages")}
                        className="h-8 w-8 p-0"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadAffirmations(set)}
                        disabled={set.affirmations.length === 0}
                        title={t("affirmations.playAffirmations")}
                        className="h-8 w-8 p-0"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSetToDelete(set.id);
                          setDeleteConfirmOpen(true);
                        }}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500 h-8 w-8 p-0"
                        title={t("affirmations.deleteSet")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Collapsible Image Section */}
                  {imageSetId === set.id && (
                    <div className={cn("mt-4 pt-4 border-t space-y-4 animate-fade-in", affirmSectionBorder)}>
                      {set.affirmations.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          {t("affirmations.addAffirmationsFirst", { max: 10 })}
                        </p>
                      ) : (
                        <>
                      {/* Image Library - Category Filter Only */}
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          {t("affirmations.selectUpToImages", { count: set.affirmations.length })}
                        </p>
                        {/* Category Filter */}
                        <div className="space-y-2">
                          <Select
                            value={selectedCategory || undefined}
                            onValueChange={(value) => {
                              handleCategorySelect(value);
                              // Auto-load library when category is selected if not already loaded
                              if (allLibraryImages.length === 0) {
                                loadImageLibrary(value);
                              }
                            }}
                          >
                            <SelectTrigger className={cn("w-full", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}>
                              <SelectValue placeholder={t("affirmations.selectCategoryPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent className={affirmMenuSurface}>
                              {availableCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {t(`affirmations.imageCategories.${cat}`, { defaultValue: cat })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Loading State */}
                        {isSearching && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="text-xs text-muted-foreground">
                              {allLibraryImages.length === 0 ? t("affirmations.loadingLibrary") : t("affirmations.loadingImages")}
                            </span>
                          </div>
                        )}

                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                {t("affirmations.showingImages", {
                                  visible: Math.min(visibleImageCount, searchResults.length),
                                  total: searchResults.length,
                                  count: searchResults.length,
                                })}
                                {selectedCategory
                                  ? t("affirmations.inCategory", {
                                      category: t(`affirmations.imageCategories.${selectedCategory}`, {
                                        defaultValue: selectedCategory,
                                      }),
                                    })
                                  : ""}
                                {selectedImages.size > 0
                                  ? t("affirmations.selectedCount", {
                                      selected: selectedImages.size,
                                      max: set.affirmations.length,
                                    })
                                  : ""}
                                </p>
                                {selectedImages.size > 0 && (
                                  <Button 
                                    size="sm" 
                                    onClick={addSelectedImages}
                                    className="h-7"
                                  >
                                    {t("affirmations.addImagesButton", { count: selectedImages.size })}
                                  </Button>
                                )}
                              </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                                {searchResults.slice(0, visibleImageCount).map((image) => (
                                  <div 
                                    key={image.id} 
                                    className={`relative group aspect-square cursor-pointer border-2 rounded-md overflow-hidden bg-muted/50 ${
                                      selectedImages.has(image.id) 
                                        ? 'border-primary ring-2 ring-primary/20' 
                                        : 'border-transparent hover:border-primary/40'
                                    }`}
                                    onClick={() => toggleImageSelection(image, set.affirmations.length)}
                                  >
                                    <img
                                      src={image.thumb || image.url}
                                      alt={image.description || t("affirmations.imageAlt")}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      decoding="async"
                                      width="120"
                                      height="120"
                                    />
                                    {selectedImages.has(image.id) && (
                                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <Badge variant="default" className="text-xs">
                                          {t("affirmations.selected")}
                                        </Badge>
                                      </div>
                                    )}
                                  {image.category && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                                      {t(`affirmations.imageCategories.${image.category}`, {
                                        defaultValue: image.category,
                                      })}
                                    </div>
                                  )}
                                  </div>
                                ))}
                              </div>
                              {visibleImageCount < searchResults.length && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setVisibleImageCount(prev => Math.min(prev + 12, searchResults.length))}
                                  className="w-full"
                                >
                                  {t("affirmations.loadMore", { remaining: searchResults.length - visibleImageCount })}
                                </Button>
                              )}
                            </div>
                            </div>
                          )}

                        {allLibraryImages.length > 0 && searchResults.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            {t("affirmations.noImagesFound")}
                          </p>
                        )}
                          </div>

                      {/* Image Grid */}
                      {set.images && set.images.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">
                            {t("affirmations.imageCount", { count: set.images.length })}
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {set.images.map((img) => (
                              <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border-2 border-primary/20">
                                <img
                                  src={img.url}
                                  alt={t("affirmations.visionBoardImageAlt")}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(set.id, img.id)}
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      </>
                      )}
                    </div>
                  )}

                  {/* Collapsible Edit Section */}
                  {editingSetId === set.id && (
                    <div className={cn("mt-4 pt-4 border-t space-y-3 animate-fade-in", affirmSectionBorder)}>
                      <Input
                        placeholder={t("affirmations.affirmationInputPlaceholder")}
                        maxLength={AFFIRMATION_LINE_MAX_LENGTH}
                        className={cn("text-sm", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            const text = input.value.trim().slice(0, AFFIRMATION_LINE_MAX_LENGTH);
                            if (text && set.affirmations.length < 10) {
                              const updatedSet = {
                                ...set,
                                affirmations: [...set.affirmations, text],
                              };
                              const updatedSets = sets.map(s => s.id === set.id ? updatedSet : s);
                              saveSets(updatedSets);
                              input.value = "";
                              toast.success(t("affirmations.toasts.affirmationAdded"));
                            } else if (set.affirmations.length >= 10) {
                              toast.error(t("affirmations.toasts.maxAffirmations"));
                            }
                          }
                        }}
                        disabled={set.affirmations.length >= 10}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("affirmations.affirmationLimitHint", {
                          current: set.affirmations.length,
                          max: AFFIRMATION_LINE_MAX_LENGTH,
                        })}
                      </p>

                      {set.affirmations.length > 0 && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {set.affirmations.map((aff, index) => (
                            <div
                              key={index}
                              className={cn("grid grid-cols-[minmax(0,1fr)_1.5rem] gap-2 items-start", affirmListRow)}
                            >
                              <p className="leading-relaxed">{aff}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updatedSet = {
                                    ...set,
                                    affirmations: set.affirmations.filter((_, i) => i !== index)
                                  };
                                  const updatedSets = sets.map(s => s.id === set.id ? updatedSet : s);
                                  saveSets(updatedSets);
                                  toast.success(t("affirmations.toasts.affirmationRemoved"));
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                title={t("affirmations.deleteAffirmation")}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Premade Sets Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold">{t("affirmations.premadeSets")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("affirmations.premadeSetsSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sets.filter(s => s.isPremade).map(set => (
            <Card
              key={set.id}
              className={cn("overflow-hidden rounded-xl shadow-sm transition-colors", affirmCardClass)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {STARTER_AFFIRMATION_SET_NAMES.includes(set.name) ? t("affirmations.starterSetName") : set.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("affirmations.affirmationCount", { count: set.affirmations.length })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingSetId(viewingSetId === set.id ? null : set.id)}
                      title={t("affirmations.viewAffirmations")}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadAffirmations(set)}
                      title={t("affirmations.playAffirmations")}
                      className="h-8 w-8 p-0"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Show Affirmations (Read-only) */}
                {viewingSetId === set.id && (
                  <div className={cn("mt-4 pt-4 border-t space-y-2 animate-fade-in", affirmSectionBorder)}>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {set.affirmations.map((aff, index) => (
                        <div
                          key={index}
                          className={affirmReadOnlyRow}
                        >
                          <p className="leading-relaxed">{aff}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("affirmations.deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("affirmations.deleteDialogDescription", { name: sets.find(s => s.id === setToDelete)?.name || t("affirmations.thisSet") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSetToDelete(null)}>{t("affirmations.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => setToDelete && deleteSet(setToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("affirmations.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
    </div>
  );
};

export default Affirmations;
