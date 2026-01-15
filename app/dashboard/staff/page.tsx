'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getStaff, getShops, createStaff, updateStaff, updateStaffShops, deleteStaff } from '@/lib/supabase/queries';
import { validateRequired } from '@/lib/utils/validation';
import { Shop } from '@/lib/types/database';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [formData, setFormData] = useState({ full_name: '', phone: '', start_date: '', end_date: '', status: 'active' as 'active' | 'inactive', shop_ids: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStaff();
    loadShops();
  }, []);

  async function loadStaff() {
    const { data } = await getStaff();
    if (data) setStaff(data);
  }

  async function loadShops() {
    const { data } = await getShops();
    if (data) setShops(data);
  }

  function openForm(member?: any) {
    if (member) {
      setEditingStaff(member);
      const shopIds = member.staff_shops?.map((ss: any) => ss.shop_id) || [];
      setFormData({ full_name: member.full_name, phone: member.phone || '', start_date: member.start_date || '', end_date: member.end_date || '', status: member.status, shop_ids: shopIds });
    } else {
      setEditingStaff(null);
      setFormData({ full_name: '', phone: '', start_date: '', end_date: '', status: 'active', shop_ids: [] });
    }
    setShowForm(true);
    setErrors({});
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    const nameValidation = validateRequired(formData.full_name, 'Full name');
    if (!nameValidation.valid) newErrors.full_name = nameValidation.error!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    const staffData = { full_name: formData.full_name, phone: formData.phone || undefined, start_date: formData.start_date || undefined, end_date: formData.end_date || undefined, status: formData.status };

    if (editingStaff) {
      await updateStaff(editingStaff.id, staffData);
      await updateStaffShops(editingStaff.id, formData.shop_ids);
    } else {
      const { data } = await createStaff(staffData);
      if (data) await updateStaffShops(data.id, formData.shop_ids);
    }

    setShowForm(false);
    loadStaff();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this staff member?')) return;
    await deleteStaff(id);
    loadStaff();
  }

  function toggleShop(shopId: string) {
    setFormData(prev => ({
      ...prev,
      shop_ids: prev.shop_ids.includes(shopId)
        ? prev.shop_ids.filter(id => id !== shopId)
        : [...prev.shop_ids, shopId]
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-muted-foreground">Manage staff members</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">👥</p>
              <p className="text-lg font-medium mb-2">No Staff Members</p>
              <p className="text-muted-foreground mb-4">Add staff to keep track of who works at each shop.</p>
              <Button onClick={() => openForm()}>Add Staff</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Phone</th>
                    <th className="text-left p-2">Start Date</th>
                    <th className="text-left p-2">End Date</th>
                    <th className="text-left p-2">Assigned Shops</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="p-2">{member.full_name}</td>
                      <td className="p-2">{member.phone || '-'}</td>
                      <td className="p-2">{member.start_date || '-'}</td>
                      <td className="p-2">{member.end_date || '-'}</td>
                      <td className="p-2">
                        {member.staff_shops?.map((ss: any) => ss.shops?.name).join(', ') || '-'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="text-right p-2">
                        <Button variant="ghost" size="icon" onClick={() => openForm(member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
                {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="XXX-XXX-XXXX"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Assigned Shops</Label>
                <div className="space-y-2 mt-2">
                  {shops.map((shop) => (
                    <label key={shop.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.shop_ids.includes(shop.id)}
                        onChange={() => toggleShop(shop.id)}
                      />
                      {shop.name}
                    </label>
                  ))}
                </div>
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
                      checked={formData.status === 'inactive'}
                      onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    />
                    Inactive
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
