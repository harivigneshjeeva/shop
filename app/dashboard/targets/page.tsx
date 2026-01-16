'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getTargets, getShops, createTarget, updateTarget, deleteTarget, getSalesByDateRange } from '@/lib/supabase/queries';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { validateAmount, validateRequired } from '@/lib/utils/validation';
import { Shop } from '@/lib/types/database';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export default function TargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState<any | null>(null);
  const [formData, setFormData] = useState({ shop_id: '', target_type: 'monthly', target_date: '', sales_target: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [achievements, setAchievements] = useState<Record<string, { actual: number; percentage: number }>>({});

  useEffect(() => {
    loadShops();
    loadTargets();
  }, []);

  async function loadShops() {
    const { data } = await getShops();
    if (data) setShops(data);
  }

  async function loadTargets() {
    const { data } = await getTargets();
    if (data) {
      setTargets(data);
      await calculateAchievements(data);
    }
  }

  async function calculateAchievements(targetsData: any[]) {
    const achievementMap: Record<string, { actual: number; percentage: number }> = {};
    
    for (const target of targetsData) {
      let startDate: Date, endDate: Date;
      
      if (target.target_type === 'monthly') {
        startDate = startOfMonth(new Date(target.target_date));
        endDate = endOfMonth(new Date(target.target_date));
      } else if (target.target_type === 'weekly') {
        startDate = startOfWeek(new Date(target.target_date), { weekStartsOn: 1 });
        endDate = endOfWeek(new Date(target.target_date), { weekStartsOn: 1 });
      } else {
        startDate = new Date(target.target_date);
        endDate = new Date(target.target_date);
      }

      const { data: sales } = await getSalesByDateRange(startDate, endDate, [target.shop_id]);
      const actual = sales?.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) || 0;
      const percentage = (actual / Number(target.sales_target)) * 100;
      
      achievementMap[target.id] = { actual, percentage };
    }
    
    setAchievements(achievementMap);
  }

  function validateForm() {
    const newErrors: Record<string, string> = {};
    
    const shopValidation = validateRequired(formData.shop_id, 'Shop');
    if (!shopValidation.valid) newErrors.shop_id = shopValidation.error!;
    
    const dateValidation = validateRequired(formData.target_date, 'Date');
    if (!dateValidation.valid) newErrors.target_date = dateValidation.error!;
    
    const targetValidation = validateAmount(formData.sales_target);
    if (!targetValidation.valid) newErrors.sales_target = targetValidation.error!;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function openForm(target?: any) {
    if (target) {
      setEditingTarget(target);
      setFormData({
        shop_id: target.shop_id,
        target_type: target.target_type,
        target_date: target.target_date,
        sales_target: target.sales_target
      });
    } else {
      setEditingTarget(null);
      setFormData({ shop_id: '', target_type: 'monthly', target_date: '', sales_target: '' });
    }
    setShowForm(true);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      shop_id: formData.shop_id,
      target_type: formData.target_type,
      target_date: formData.target_date,
      sales_target: parseFloat(formData.sales_target)
    };

    editingTarget ? await updateTarget(editingTarget.id, data) : await createTarget(data);
    setShowForm(false);
    loadTargets();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this target?')) return;
    await deleteTarget(id);
    loadTargets();
  }

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Targets & Goals</h1>
          <p className="text-muted-foreground">Set and track sales targets</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Target
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {targets.slice(0, 3).map((target) => {
          const achievement = achievements[target.id];
          const isAchieved = achievement && achievement.percentage >= 100;
          
          return (
            <Card key={target.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {target.shops?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <span className="font-medium">{formatCurrency(Number(target.sales_target))}</span>
                  </div>
                  {achievement && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Actual</span>
                        <span className="font-medium">{formatCurrency(achievement.actual)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isAchieved ? 'bg-green-600' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(achievement.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isAchieved ? 'text-green-600' : 'text-blue-600'}`}>
                          {achievement.percentage.toFixed(1)}%
                        </span>
                        {isAchieved ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Targets</CardTitle>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">🎯</p>
              <p className="text-lg font-medium mb-2">No Targets Set</p>
              <p className="text-muted-foreground mb-4">Set sales targets to track performance.</p>
              <Button onClick={() => openForm()}>Add Target</Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Shop</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Period</th>
                      <th className="text-right p-2">Target</th>
                      <th className="text-right p-2">Actual</th>
                      <th className="text-right p-2">Achievement</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map((target) => {
                      const achievement = achievements[target.id];
                      const isAchieved = achievement && achievement.percentage >= 100;
                      
                      return (
                        <tr key={target.id} className="border-b">
                          <td className="p-2">{target.shops?.name}</td>
                          <td className="p-2 capitalize">{target.target_type}</td>
                          <td className="p-2">{formatDate(target.target_date)}</td>
                          <td className="text-right p-2">{formatCurrency(Number(target.sales_target))}</td>
                          <td className="text-right p-2">
                            {achievement ? formatCurrency(achievement.actual) : '-'}
                          </td>
                          <td className="text-right p-2">
                            {achievement && (
                              <span className={`font-medium ${isAchieved ? 'text-green-600' : 'text-orange-600'}`}>
                                {achievement.percentage.toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="text-right p-2">
                            <Button variant="ghost" size="icon" onClick={() => openForm(target)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(target.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="lg:hidden space-y-3">
                {targets.map((target) => {
                  const achievement = achievements[target.id];
                  const isAchieved = achievement && achievement.percentage >= 100;
                  
                  return (
                    <Card key={target.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-semibold text-sm">{target.shops?.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {target.target_type} • {formatDate(target.target_date)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openForm(target)} className="min-h-[36px] min-w-[36px]">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(target.id)} className="min-h-[36px] min-w-[36px]">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {achievement && (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${isAchieved ? 'bg-green-600' : 'bg-blue-600'}`}
                                style={{ width: `${Math.min(achievement.percentage, 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                {isAchieved ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-orange-600" />
                                )}
                                <span className={`font-medium ${isAchieved ? 'text-green-600' : 'text-orange-600'}`}>
                                  {achievement.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-muted-foreground text-xs">Target</p>
                                <p className="font-medium">{formatCurrency(Number(target.sales_target))}</p>
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Actual: </span>
                              <span className="font-medium">{formatCurrency(achievement.actual)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTarget ? 'Edit Target' : 'Add Target'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Shop *</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={formData.shop_id}
                  onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                >
                  <option value="">Select shop</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
                {errors.shop_id && <p className="text-sm text-red-500 mt-1">{errors.shop_id}</p>}
              </div>
              <div>
                <Label>Target Type *</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <Label>Target Date *</Label>
                <Input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
                {errors.target_date && <p className="text-sm text-red-500 mt-1">{errors.target_date}</p>}
              </div>
              <div>
                <Label>Sales Target *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sales_target}
                  onChange={(e) => setFormData({ ...formData, sales_target: e.target.value })}
                />
                {errors.sales_target && <p className="text-sm text-red-500 mt-1">{errors.sales_target}</p>}
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
