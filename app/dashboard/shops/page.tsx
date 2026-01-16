'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getShops, createShop, updateShop } from '@/lib/supabase/queries';
import { validateRequired } from '@/lib/utils/validation';
import { Shop } from '@/lib/types/database';

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({ name: '', city: '', status: 'active' as 'active' | 'retired' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadShops();
  }, []);

  async function loadShops() {
    const { data } = await getShops(true);
    if (data) setShops(data);
  }

  function openForm(shop?: Shop) {
    if (shop) {
      setEditingShop(shop);
      setFormData({ name: shop.name, city: shop.city || '', status: shop.status });
    } else {
      setEditingShop(null);
      setFormData({ name: '', city: '', status: 'active' });
    }
    setShowForm(true);
    setErrors({});
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    const nameValidation = validateRequired(formData.name, 'Shop name');
    if (!nameValidation.valid) newErrors.name = nameValidation.error!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingShop) {
      await updateShop(editingShop.id, formData);
    } else {
      await createShop(formData);
    }

    setShowForm(false);
    loadShops();
  }

  async function toggleStatus(shop: Shop) {
    const newStatus = shop.status === 'active' ? 'retired' : 'active';
    const message = newStatus === 'retired' 
      ? 'This shop will be hidden from new entries but historical data will be preserved.'
      : 'This shop will be available for new entries.';
    
    if (!confirm(message)) return;
    await updateShop(shop.id, { name: shop.name, city: shop.city || undefined, status: newStatus });
    loadShops();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shops</h1>
          <p className="text-muted-foreground">Manage your shop locations</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Shop
        </Button>
      </div>

      {shops.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-4xl mb-4">🏪</p>
            <p className="text-lg font-medium mb-2">No Shops Yet</p>
            <p className="text-muted-foreground mb-4">Create your first shop to start tracking sales and expenses.</p>
            <Button onClick={() => openForm()}>Add Shop</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{shop.name}</CardTitle>
                    {shop.city && <p className="text-sm text-muted-foreground mt-1">{shop.city}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    shop.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shop.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openForm(shop)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(shop)}>
                    <Power className="h-4 w-4 mr-1" />
                    {shop.status === 'active' ? 'Retire' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingShop ? 'Edit Shop' : 'Add Shop'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Shop Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={100}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.status === 'active'}
                      onChange={() => setFormData({ ...formData, status: 'active' })}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.status === 'retired'}
                      onChange={() => setFormData({ ...formData, status: 'retired' })}
                    />
                    Retired
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
