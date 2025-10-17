import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  History, 
  RotateCcw, 
  Trash2, 
  AlertCircle, 
  CheckCircle2,
  Package,
  FolderOpen,
  Calendar
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';

interface ArchivedItem {
  id: string;
  names: {
    en: string;
    tr: string;
    ar: string;
  };
  category_id: string;
  price: number;
  image?: string;
  tags: string[];
  variants?: Array<{
    size: string;
    price: number;
  }>;
  deleted_at: string;
  deleted_by?: string;
}

interface ArchivedCategory {
  id: string;
  names: {
    en: string;
    tr: string;
    ar: string;
  };
  icon: string;
  order: number;
  deleted_at: string;
  deleted_by?: string;
}

interface HistoryPanelProps {
  onRestore?: () => void;
}

export function HistoryPanel({ onRestore }: HistoryPanelProps) {
  const { lang } = useLang();
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([]);
  const [archivedCategories, setArchivedCategories] = useState<ArchivedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadArchived();
  }, []);

  const loadArchived = async () => {
    setLoading(true);
    try {
      // Fetch archived items
      const itemsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4050140e/archive/items`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      // Fetch archived categories
      const categoriesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4050140e/archive/categories`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (itemsResponse.ok) {
        const items = await itemsResponse.json();
        setArchivedItems(items || []);
      }

      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        setArchivedCategories(categories || []);
      }
    } catch (error) {
      console.error('Error loading archived data:', error);
      toast.error('Failed to load archived data');
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (item: ArchivedItem) => {
    setRestoring(item.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4050140e/archive/restore/item/${item.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore item');
      }

      toast.success(`Restored "${item.names.en}"`);
      await loadArchived();
      if (onRestore) onRestore();
    } catch (error) {
      toast.error('Failed to restore item');
      console.error('Error restoring item:', error);
    } finally {
      setRestoring(null);
    }
  };

  const restoreCategory = async (category: ArchivedCategory) => {
    setRestoring(category.id);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4050140e/archive/restore/category/${category.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore category');
      }

      toast.success(`Restored "${category.names.en}"`);
      await loadArchived();
      if (onRestore) onRestore();
    } catch (error) {
      toast.error('Failed to restore category');
      console.error('Error restoring category:', error);
    } finally {
      setRestoring(null);
    }
  };

  const permanentlyDelete = async (type: 'item' | 'category', id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone!`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4050140e/archive/${type}/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to permanently delete');
      }

      toast.success(`Permanently deleted "${name}"`);
      await loadArchived();
    } catch (error) {
      toast.error('Failed to permanently delete');
      console.error('Error permanently deleting:', error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <History className="h-8 w-8 mx-auto animate-spin" style={{ color: '#0C6071' }} />
            <p className="text-gray-600">Loading history...</p>
          </div>
        </div>
      </Card>
    );
  }

  const totalArchived = archivedItems.length + archivedCategories.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <History className="h-5 w-5" style={{ color: '#0C6071' }} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl" style={{ color: '#0C6071' }}>
              {t('history', lang)}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {lang === 'en' ? 'View and restore deleted data' : 
               lang === 'tr' ? 'Silinen verileri görüntüle ve geri yükle' :
               'عرض واستعادة البيانات المحذوفة'}
            </p>
          </div>
        </div>
      </div>

      {totalArchived === 0 ? (
        <Alert className="bg-blue-50 border-blue-200">
          <FolderOpen className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            {lang === 'en' ? 'No archived data found' :
             lang === 'tr' ? 'Arşivlenmiş veri bulunamadı' :
             'لم يتم العثور على بيانات مؤرشفة'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-600 mb-1">
                {lang === 'en' ? 'Total' : lang === 'tr' ? 'Toplam' : 'المجموع'}
              </div>
              <div className="text-lg sm:text-xl" style={{ color: '#0C6071' }}>
                {totalArchived}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-600 mb-1">{t('items', lang)}</div>
              <div className="text-lg sm:text-xl text-orange-600">
                {archivedItems.length}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-600 mb-1">{t('categories', lang)}</div>
              <div className="text-lg sm:text-xl text-purple-600">
                {archivedCategories.length}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 sm:p-3">
              <div className="text-xs text-gray-600 mb-1">
                {lang === 'en' ? 'Restorable' : lang === 'tr' ? 'Geri Yüklenebilir' : 'قابل للاستعادة'}
              </div>
              <div className="text-lg sm:text-xl text-green-600">
                {totalArchived}
              </div>
            </div>
          </div>
        )}

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="items">
            {t('items', lang)} ({archivedItems.length})
          </TabsTrigger>
          <TabsTrigger value="categories">
            {t('categories', lang)} ({archivedCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4 mt-6">
          {archivedItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">{t('noArchivedItems', lang)}</p>
            </Card>
          ) : (
            archivedItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.names.en}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-medium truncate">{item.names.en}</h3>
                        <p className="text-sm text-gray-600">{item.names.tr} • {item.names.ar}</p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {item.price} TL
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {t('deletedAt', lang)}: {new Date(item.deleted_at).toLocaleDateString()}
                      </span>
                      {item.variants && item.variants.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {item.variants.length} {t('variants', lang)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => restoreItem(item)}
                        disabled={restoring === item.id}
                        style={{ backgroundColor: '#0C6071' }}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('restore', lang)}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => permanentlyDelete('item', item.id, item.names.en)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('permanentDelete', lang)}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-6">
          {archivedCategories.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">{t('noArchivedCategories', lang)}</p>
            </Card>
          ) : (
            archivedCategories.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{category.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{category.names.en}</h3>
                        <p className="text-sm text-gray-600">{category.names.tr} • {category.names.ar}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {t('deletedAt', lang)}: {new Date(category.deleted_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => restoreCategory(category)}
                        disabled={restoring === category.id}
                        style={{ backgroundColor: '#0C6071' }}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        {t('restore', lang)}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => permanentlyDelete('category', category.id, category.names.en)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('permanentDelete', lang)}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
