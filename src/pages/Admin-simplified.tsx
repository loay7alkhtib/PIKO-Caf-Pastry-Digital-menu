import { useEffect, useState } from 'react';
import { useLang } from '../lib/LangContext';
import { useData } from '../lib/DataContext';
import { t } from '../lib/i18n';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';

interface AdminProps {
  onNavigate: (page: string) => void;
}

export default function Admin({ onNavigate }: AdminProps) {
  const { lang } = useLang();
  const { categories, items, refetch } = useData();
  const [activeTab, setActiveTab] = useState('categories');
  const [_editingCategory, setEditingCategory] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [_editingItem, setEditingItem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [password, setPassword] = useState('');

  // Simple admin access check
  useEffect(() => {
    const hasAccess = localStorage.getItem('admin-access') === 'true';
    if (hasAccess) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => setShowPasswordPrompt(false), 0);
    }
  }, []);

  const handleAdminAccess = () => {
    if (password === 'admin123') {
      localStorage.setItem('admin-access', 'true');
      setShowPasswordPrompt(false);
    } else {
      // eslint-disable-next-line no-alert
      alert('Incorrect password');
    }
  };

  if (showPasswordPrompt) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='w-full max-w-md p-6'>
          <h2 className='text-2xl font-medium mb-4'>Admin Access</h2>
          <div className='space-y-4'>
            <Input
              type='password'
              placeholder='Admin Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAdminAccess()}
            />
            <Button onClick={handleAdminAccess} className='w-full'>
              Access Admin
            </Button>
            <Button
              variant='ghost'
              onClick={() => onNavigate('home')}
              className='w-full'
            >
              Back to Menu
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-access');
    onNavigate('home');
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40'>
        <div className='max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button
              onClick={() => onNavigate('home')}
              variant='ghost'
              size='sm'
              className='gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to Menu
            </Button>
            <h1 className='text-xl font-medium'>{t('adminPanel', lang)}</h1>
          </div>

          <div className='flex items-center gap-2'>
            <Button onClick={refetch} variant='ghost' size='sm'>
              Refresh
            </Button>
            <Button onClick={handleLogout} variant='outline' size='sm'>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className='max-w-[1600px] mx-auto px-4 py-6'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full max-w-2xl mx-auto grid-cols-2 mb-6'>
            <TabsTrigger value='categories'>
              {t('categories', lang)}
            </TabsTrigger>
            <TabsTrigger value='items'>{t('items', lang)}</TabsTrigger>
          </TabsList>

          <TabsContent value='categories'>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <h2 className='text-2xl font-medium'>
                  {t('categories', lang)}
                </h2>
                <Button
                  onClick={() => setEditingCategory({})}
                  className='gap-2'
                >
                  <Plus className='w-4 h-4' />
                  Add Category
                </Button>
              </div>

              <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
                {categories.map(category => (
                  <Card key={category.id} className='p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='text-2xl'>{category.icon}</div>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => setEditingCategory(category)}
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            // eslint-disable-next-line no-alert
                            if (confirm('Delete this category?')) {
                              // Delete category logic
                            }
                          }}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                    <h3 className='font-medium mb-2'>
                      {category.names[lang] || category.names.en}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {
                        items.filter(item => item.category_id === category.id)
                          .length
                      }{' '}
                      items
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value='items'>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <h2 className='text-2xl font-medium'>{t('items', lang)}</h2>
                <Button onClick={() => setEditingItem({})} className='gap-2'>
                  <Plus className='w-4 h-4' />
                  Add Item
                </Button>
              </div>

              <div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
                {items.map(item => (
                  <Card key={item.id} className='p-4'>
                    <div className='aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-2xl'>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.names[lang] || item.names.en}
                          className='w-full h-full object-cover rounded-lg'
                        />
                      ) : (
                        '🍽️'
                      )}
                    </div>

                    <div className='space-y-2'>
                      <h3 className='font-medium'>
                        {item.names[lang] || item.names.en}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        {categories.find(c => c.id === item.category_id)?.names[
                          lang
                        ] ||
                          categories.find(c => c.id === item.category_id)?.names
                            .en}
                      </p>
                      <p className='text-lg font-medium text-primary'>
                        ₺{item.price.toFixed(2)}
                      </p>

                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => setEditingItem(item)}
                          className='flex-1'
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            // eslint-disable-next-line no-alert
                            if (confirm('Delete this item?')) {
                              // Delete item logic
                            }
                          }}
                          className='flex-1'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
