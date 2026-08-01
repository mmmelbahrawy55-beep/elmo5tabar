'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/design-system/layout/Card';
import { Badge } from '@/design-system/primitives/Badge';
import { Button } from '@/design-system/primitives/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/design-system/navigation/Tabs';
import { SearchInput, FormField, FormGroup, FormSection } from '@/design-system/forms/FormField';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog, LoadingSpinner } from '@/design-system/feedback/Alert';
import { ProgressBar } from '@/design-system/feedback/Progress';
import { Switch } from '@/design-system/primitives/Input';
import ExportButton from '@/components/admin/ExportButton';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  supplier: string;
  expiryDate: string;
  status: 'in_stock' | 'low_stock' | 'expired' | 'out_of_stock';
  lastRestocked: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  status: 'pending' | 'approved' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  productsCount: number;
  rating: number;
  isActive: boolean;
}

const mockProducts: Product[] = [
  { id: '1', sku: 'MED-001', name: 'كواشف التحليل العام', category: 'كواشف', quantity: 450, minQuantity: 100, unitPrice: 120, supplier: 'شركة الشرق الأوسط', expiryDate: '2027-03-15', status: 'in_stock', lastRestocked: '2026-07-01' },
  { id: '2', sku: 'MED-002', name: 'أنابيب جمع الدم (EDTA)', category: 'أدوات جمع', quantity: 2500, minQuantity: 500, unitPrice: 0.5, supplier: 'مورد الأدوات الطبية', expiryDate: '2028-06-30', status: 'in_stock', lastRestocked: '2026-07-10' },
  { id: '3', sku: 'MED-003', name: 'كواشف الكيمياء الحيوية', category: 'كواشف', quantity: 35, minQuantity: 50, unitPrice: 250, supplier: 'شركة الشرق الأوسط', expiryDate: '2026-12-25', status: 'low_stock', lastRestocked: '2026-06-15' },
  { id: '4', sku: 'MED-004', name: 'محلول التنظيف الآلي', category: 'مواد تنظيف', quantity: 120, minQuantity: 30, unitPrice: 45, supplier: 'شركة النظافة الطبية', expiryDate: '2026-08-20', status: 'in_stock', lastRestocked: '2026-07-05' },
  { id: '5', sku: 'MED-005', name: 'كواشف وظائف الكلى', category: 'كواشف', quantity: 18, minQuantity: 40, unitPrice: 180, supplier: 'شركة الشرق الأوسط', expiryDate: '2026-09-10', status: 'low_stock', lastRestocked: '2026-05-20' },
  { id: '6', sku: 'MED-006', name: 'شرائح تحليل الكرياتينين', category: 'كواشف', quantity: 0, minQuantity: 25, unitPrice: 320, supplier: 'شركة الدقة الطبية', expiryDate: '2026-07-15', status: 'expired', lastRestocked: '2026-01-10' },
  { id: '7', sku: 'MED-007', name: 'أكياس نفايات طبية', category: 'مواد استهلاكية', quantity: 800, minQuantity: 200, unitPrice: 2, supplier: 'شركة النظافة الطبية', expiryDate: '2029-12-31', status: 'in_stock', lastRestocked: '2026-07-20' },
  { id: '8', sku: 'MED-008', name: 'قفازات طبية (M)', category: 'مواد استهلاكية', quantity: 45, minQuantity: 100, unitPrice: 8, supplier: 'مورد الأدوات الطبية', expiryDate: '2027-05-30', status: 'low_stock', lastRestocked: '2026-06-01' },
  { id: '9', sku: 'MED-009', name: 'كواشف الفيروسات', category: 'كواشف', quantity: 280, minQuantity: 80, unitPrice: 450, supplier: 'شركة الدقة الطبية', expiryDate: '2027-01-20', status: 'in_stock', lastRestocked: '2026-07-15' },
  { id: '10', sku: 'MED-010', name: 'محلول تعقيم الأيدي', category: 'مواد تنظيف', quantity: 15, minQuantity: 50, unitPrice: 35, supplier: 'شركة النظافة الطبية', expiryDate: '2026-11-30', status: 'low_stock', lastRestocked: '2026-06-20' },
];

const mockPurchaseOrders: PurchaseOrder[] = [
  { id: '1', orderNumber: 'PO-2026-045', supplier: 'شركة الشرق الأوسط', items: [{ productName: 'كواشف التحليل العام', quantity: 200, unitPrice: 120 }, { productName: 'كواشف الكيمياء الحيوية', quantity: 100, unitPrice: 250 }], totalAmount: 49000, status: 'delivered', orderDate: '2026-07-01', expectedDelivery: '2026-07-10' },
  { id: '2', orderNumber: 'PO-2026-046', supplier: 'مورد الأدوات الطبية', items: [{ productName: 'أنابيب جمع الدم', quantity: 5000, unitPrice: 0.5 }, { productName: 'قفازات طبية', quantity: 500, unitPrice: 8 }], totalAmount: 26500, status: 'pending', orderDate: '2026-07-25', expectedDelivery: '2026-08-05' },
  { id: '3', orderNumber: 'PO-2026-047', supplier: 'شركة الدقة الطبية', items: [{ productName: 'كواشف الفيروسات', quantity: 50, unitPrice: 450 }], totalAmount: 22500, status: 'approved', orderDate: '2026-07-27', expectedDelivery: '2026-08-03' },
  { id: '4', orderNumber: 'PO-2026-048', supplier: 'شركة النظافة الطبية', items: [{ productName: 'محلول التنظيف', quantity: 100, unitPrice: 45 }, { productName: 'محلول تعقيم', quantity: 200, unitPrice: 35 }], totalAmount: 11500, status: 'pending', orderDate: '2026-07-28', expectedDelivery: '2026-08-02' },
];

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'شركة الشرق الأوسط', contact: 'أحمد الخالدي', email: 'ahmed@eastern-med.com', phone: '+966501234567', productsCount: 45, rating: 4.5, isActive: true },
  { id: '2', name: 'مورد الأدوات الطبية', contact: 'سالم العتيبي', email: 'salem@med-tools.com', phone: '+966507654321', productsCount: 32, rating: 4.2, isActive: true },
  { id: '3', name: 'شركة الدقة الطبية', contact: 'نورة الحربي', email: 'noura@precision-med.com', phone: '+966509876543', productsCount: 28, rating: 4.8, isActive: true },
  { id: '4', name: 'شركة النظافة الطبية', contact: 'خالد الغامدي', email: 'khalid@clean-med.com', phone: '+966503456789', productsCount: 18, rating: 3.9, isActive: true },
];

export default function InventoryManagementPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [products] = useState<Product[]>(mockProducts);
  const [purchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [suppliers] = useState<Supplier[]>(mockSuppliers);

  const [newProduct, setNewProduct] = useState({
    sku: '', name: '', category: '', quantity: '', minQuantity: '',
    unitPrice: '', supplier: '', expiryDate: '',
  });

  const [newOrder, setNewOrder] = useState({
    supplier: '', items: [{ productName: '', quantity: '', unitPrice: '' }],
  });

  const categories = [...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || p.sku.includes(searchQuery);
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalInventoryValue = products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const lowStockCount = products.filter(p => p.status === 'low_stock').length;
  const expiredCount = products.filter(p => p.status === 'expired').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'in_stock': return <Badge variant="success">متوفر</Badge>;
      case 'low_stock': return <Badge variant="warning">库存不足</Badge>;
      case 'expired': return <Badge variant="danger">منتهي الصلاحية</Badge>;
      case 'out_of_stock': return <Badge variant="danger">نفد</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const orderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">قيد الانتظار</Badge>;
      case 'approved': return <Badge variant="info">معتمد</Badge>;
      case 'delivered': return <Badge variant="success">تم التسليم</Badge>;
      case 'cancelled': return <Badge variant="danger">ملغي</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getStockLevel = (product: Product) => {
    if (product.status === 'expired') return 'expired';
    if (product.quantity === 0) return 'out';
    if (product.quantity < product.minQuantity) return 'low';
    if (product.quantity < product.minQuantity * 1.5) return 'medium';
    return 'good';
  };

  const stockColor = (level: string) => {
    switch (level) {
      case 'expired': return 'text-danger';
      case 'out': return 'text-danger';
      case 'low': return 'text-warning';
      case 'medium': return 'text-yellow-600';
      default: return 'text-success';
    }
  };

  const handleAddOrderItem = () => {
    setNewOrder(prev => ({ ...prev, items: [...prev.items, { productName: '', quantity: '', unitPrice: '' }] }));
  };

  const handleRemoveOrderItem = (index: number) => {
    setNewOrder(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSaveProduct = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowAddProductDialog(false);
      setNewProduct({ sku: '', name: '', category: '', quantity: '', minQuantity: '', unitPrice: '', supplier: '', expiryDate: '' });
    }, 800);
  };

  const handleCreateOrder = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowCreateOrderDialog(false);
      setNewOrder({ supplier: '', items: [{ productName: '', quantity: '', unitPrice: '' }] });
    }, 800);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المخزون</h1>
          <p className="text-muted-foreground mt-1">إدارة المنتجات وأوامر الشراء والموردين</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={products} filename="inventory-report" />
          <Button onClick={() => activeTab === 'products' ? setShowAddProductDialog(true) : setShowCreateOrderDialog(true)}>
            {activeTab === 'products' ? 'إضافة منتج' : 'طلب شراء جديد'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المنتجات" value={formatNumber(1234)} icon="📦" change={{ value: 8, isPositive: true }} />
        <StatCard title="على وشك النفاد" value={formatNumber(lowStockCount)} icon="⚠️" change={{ value: 3, isPositive: false }} className="border-r-2 border-r-warning" />
        <StatCard title="منتهي الصلاحية" value={formatNumber(expiredCount)} icon="🔴" change={{ value: expiredCount, isPositive: false }} className="border-r-2 border-r-danger" />
        <StatCard title="قيمة المخزون" value={formatCurrency(totalInventoryValue)} icon="💰" change={{ value: 12, isPositive: true }} />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput placeholder="بحث بالاسم أو SKU..." value={searchQuery} onChange={setSearchQuery} className="w-72" />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">جميع الفئات</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <option value="all">جميع الحالات</option>
          <option value="in_stock">متوفر</option>
          <option value="low_stock">库存不足</option>
          <option value="expired">منتهي الصلاحية</option>
          <option value="out_of_stock">نفد</option>
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="orders">أوامر الشراء</TabsTrigger>
          <TabsTrigger value="suppliers">الموردين</TabsTrigger>
          <TabsTrigger value="forecast">التنبؤ بالاحتياجات</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">SKU</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">اسم المنتج</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الفئة</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الكمية</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحد الأدنى</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">سعر الوحدة</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">المورد</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">تاريخ الصلاحية</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const stockLevel = getStockLevel(product);
                      return (
                        <tr key={product.id} className={cn('border-b border-border hover:bg-muted/50 transition-colors', product.status === 'expired' && 'bg-danger/5', product.status === 'low_stock' && 'bg-warning/5')}>
                          <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3"><Badge variant="outline">{product.category}</Badge></td>
                          <td className="px-4 py-3">
                            <span className={cn('font-bold', stockColor(stockLevel))}>{formatNumber(product.quantity)}</span>
                            <div className="mt-1">
                              <ProgressBar value={product.quantity} max={product.minQuantity * 3} size="sm" className={cn(stockLevel === 'expired' || stockLevel === 'out' ? '[&>div]:bg-danger' : stockLevel === 'low' ? '[&>div]:bg-warning' : '[&>div]:bg-success')} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatNumber(product.minQuantity)}</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(product.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm">{product.supplier}</td>
                          <td className="px-4 py-3">
                            <span className={cn(new Date(product.expiryDate) < new Date() && 'text-danger font-medium', new Date(product.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && new Date(product.expiryDate) >= new Date() && 'text-warning')}>
                              {formatDate(product.expiryDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{statusBadge(product.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && <div className="py-12 text-center text-muted-foreground">لا توجد منتجات مطابقة</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">رقم الطلب</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">المورد</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">عدد الأصناف</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">المبلغ الإجمالي</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">تاريخ الطلب</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">التسليم المتوقع</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map(order => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                        <td className="px-4 py-3 font-medium">{order.supplier}</td>
                        <td className="px-4 py-3">{order.items.length} صنف</td>
                        <td className="px-4 py-3 font-bold">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(order.orderDate)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(order.expectedDelivery)}</td>
                        <td className="px-4 py-3">{orderStatusBadge(order.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map(supplier => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                    </div>
                    <Badge variant={supplier.isActive ? 'success' : 'secondary'}>{supplier.isActive ? 'نشط' : 'غير نشط'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-medium text-xs">{supplier.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">الهاتف</p>
                      <p className="font-medium text-xs">{supplier.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">عدد المنتجات</p>
                      <p className="font-medium">{supplier.productsCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">التقييم</p>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{supplier.rating}</span>
                        <span className="text-yellow-500">&#9733;</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forecast">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التنبؤ بالاحتياجات - الأسبوع القادم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.filter(p => p.status === 'low_stock' || p.quantity < p.minQuantity * 2).map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-2 h-2 rounded-full', product.status === 'low_stock' ? 'bg-warning' : product.status === 'expired' ? 'bg-danger' : 'bg-success')} />
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground mr-2">({product.sku})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div><span className="text-muted-foreground">المخزون الحالي: </span><span className={cn('font-bold', stockColor(getStockLevel(product)))}>{product.quantity}</span></div>
                        <div><span className="text-muted-foreground">الحد الأدنى: </span><span>{product.minQuantity}</span></div>
                        <div><span className="text-muted-foreground">الاقتراح: </span><span className="font-bold text-primary">{product.minQuantity * 2 - product.quantity} وحدة</span></div>
                        <Badge variant={product.status === 'low_stock' ? 'warning' : product.status === 'expired' ? 'danger' : 'info'}>
                          {product.status === 'low_stock' ? 'يحتاج إعادة تموين' : product.status === 'expired' ? 'يحتاج استبدال' : 'قريب النفاد'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>ملخص الاستهلاك الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-border bg-muted/20 text-center">
                    <div className="text-2xl font-bold text-primary">847</div>
                    <p className="text-sm text-muted-foreground mt-1">كواشف مستهلكة</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/20 text-center">
                    <div className="text-2xl font-bold text-primary">12,450</div>
                    <p className="text-sm text-muted-foreground mt-1">أدوات جمع مستخدمة</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/20 text-center">
                    <div className="text-2xl font-bold text-primary">234</div>
                    <p className="text-sm text-muted-foreground mt-1">مواد تنظيف مستخدمة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showAddProductDialog && (
        <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة منتج جديد</DialogTitle>
            </DialogHeader>
            {isSaving ? (
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            ) : (
              <FormSection>
                <FormGroup columns={2}>
                  <FormField label="رقم SKU" required>
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} placeholder="MED-XXX" />
                  </FormField>
                  <FormField label="اسم المنتج" required>
                    <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="اسم المنتج" />
                  </FormField>
                  <FormField label="الفئة" required>
                    <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                      <option value="">اختر الفئة</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="المورد" required>
                    <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.supplier} onChange={e => setNewProduct(p => ({ ...p, supplier: e.target.value }))}>
                      <option value="">اختر المورد</option>
                      {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label="الكمية" required>
                    <input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.quantity} onChange={e => setNewProduct(p => ({ ...p, quantity: e.target.value }))} placeholder="0" />
                  </FormField>
                  <FormField label="الحد الأدنى" required>
                    <input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.minQuantity} onChange={e => setNewProduct(p => ({ ...p, minQuantity: e.target.value }))} placeholder="0" />
                  </FormField>
                  <FormField label="سعر الوحدة (ر.س)" required>
                    <input type="number" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.unitPrice} onChange={e => setNewProduct(p => ({ ...p, unitPrice: e.target.value }))} placeholder="0" />
                  </FormField>
                  <FormField label="تاريخ الصلاحية" required>
                    <input type="date" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newProduct.expiryDate} onChange={e => setNewProduct(p => ({ ...p, expiryDate: e.target.value }))} />
                  </FormField>
                </FormGroup>
              </FormSection>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddProductDialog(false)}>إلغاء</Button>
              <Button onClick={handleSaveProduct} disabled={isSaving}>إضافة المنتج</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showCreateOrderDialog && (
        <Dialog open={showCreateOrderDialog} onOpenChange={setShowCreateOrderDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>طلب شراء جديد</DialogTitle>
            </DialogHeader>
            {isSaving ? (
              <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
            ) : (
              <FormSection>
                <FormField label="المورد" required>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={newOrder.supplier} onChange={e => setNewOrder(p => ({ ...p, supplier: e.target.value }))}>
                    <option value="">اختر المورد</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </FormField>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">الأصناف</h4>
                    <Button variant="outline" size="sm" onClick={handleAddOrderItem}>إضافة صنف</Button>
                  </div>
                  <div className="space-y-3">
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <input className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="اسم المنتج" value={item.productName} onChange={e => {
                          const items = [...newOrder.items];
                          items[index].productName = e.target.value;
                          setNewOrder(p => ({ ...p, items }));
                        }} />
                        <input type="number" className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="الكمية" value={item.quantity} onChange={e => {
                          const items = [...newOrder.items];
                          items[index].quantity = e.target.value;
                          setNewOrder(p => ({ ...p, items }));
                        }} />
                        <input type="number" className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="سعر الوحدة" value={item.unitPrice} onChange={e => {
                          const items = [...newOrder.items];
                          items[index].unitPrice = e.target.value;
                          setNewOrder(p => ({ ...p, items }));
                        }} />
                        {newOrder.items.length > 1 && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveOrderItem(index)}>حذف</Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 rounded-lg border border-border bg-muted/30 text-left">
                    <span className="text-muted-foreground">الإجمالي: </span>
                    <span className="font-bold text-lg">
                      {formatCurrency(newOrder.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice) || 0), 0))}
                    </span>
                  </div>
                </div>
              </FormSection>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateOrderDialog(false)}>إلغاء</Button>
              <Button onClick={handleCreateOrder} disabled={isSaving || !newOrder.supplier}>إنشاء الطلب</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="حذف المنتج"
        description={`هل أنت متأكد من حذف "${selectedProduct?.name}"؟`}
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={() => { setShowDeleteConfirm(false); setSelectedProduct(null); }}
        variant="danger"
      />
    </div>
  );
}
