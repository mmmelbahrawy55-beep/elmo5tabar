import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding auth data...');

  // 1. Create roles with hierarchy
  const roles = await Promise.all([
    prisma.authRole.upsert({ where: { name: 'SUPER_ADMIN' }, update: {}, create: { name: 'SUPER_ADMIN', nameAr: 'مدير النظام العام', level: 0, isSystem: true, description: 'Full system access', descriptionAr: 'وصول كامل للنظام' } }),
    prisma.authRole.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', nameAr: 'مدير', level: 1, isSystem: true, description: 'Branch management access', descriptionAr: 'وصول إدارة الفرع' } }),
    prisma.authRole.upsert({ where: { name: 'BRANCH_MANAGER' }, update: {}, create: { name: 'BRANCH_MANAGER', nameAr: 'مدير الفرع', level: 2, isSystem: true, description: 'Branch operations', descriptionAr: 'عمليات الفرع' } }),
    prisma.authRole.upsert({ where: { name: 'DOCTOR' }, update: {}, create: { name: 'DOCTOR', nameAr: 'طبيب', level: 3, isSystem: true, description: 'Medical staff', descriptionAr: 'طاقم طبي' } }),
    prisma.authRole.upsert({ where: { name: 'PHARMACIST' }, update: {}, create: { name: 'PHARMACIST', nameAr: 'صيدلي', level: 3, isSystem: true, description: 'Pharmacy staff', descriptionAr: 'طاقم الصيدلية' } }),
    prisma.authRole.upsert({ where: { name: 'LAB_TECHNICIAN' }, update: {}, create: { name: 'LAB_TECHNICIAN', nameAr: 'فني مختبر', level: 4, isSystem: true, description: 'Lab technicians', descriptionAr: 'فنيو المختبر' } }),
    prisma.authRole.upsert({ where: { name: 'PHLEBOTOMIST' }, update: {}, create: { name: 'PHLEBOTOMIST', nameAr: 'مبرد', level: 4, isSystem: true, description: 'Blood collection staff', descriptionAr: 'طاقم سحب الدم' } }),
    prisma.authRole.upsert({ where: { name: 'NURSE' }, update: {}, create: { name: 'NURSE', nameAr: 'ممرض', level: 4, isSystem: true, description: 'Nursing staff', descriptionAr: 'طاقم التمريض' } }),
    prisma.authRole.upsert({ where: { name: 'RECEPTIONIST' }, update: {}, create: { name: 'RECEPTIONIST', nameAr: 'موظف استقبال', level: 5, isSystem: true, description: 'Front desk', descriptionAr: 'مكتب الاستقبال' } }),
    prisma.authRole.upsert({ where: { name: 'BILLING_STAFF' }, update: {}, create: { name: 'BILLING_STAFF', nameAr: 'موظف فواتير', level: 5, isSystem: true, description: 'Billing department', descriptionAr: 'قسم الفواتير' } }),
    prisma.authRole.upsert({ where: { name: 'MARKETING_STAFF' }, update: {}, create: { name: 'MARKETING_STAFF', nameAr: 'موظف تسويق', level: 5, isSystem: true, description: 'Marketing team', descriptionAr: 'فريق التسويق' } }),
    prisma.authRole.upsert({ where: { name: 'PATIENT' }, update: {}, create: { name: 'PATIENT', nameAr: 'مريض', level: 10, isSystem: true, description: 'Patient access', descriptionAr: 'وصول المريض' } }),
    prisma.authRole.upsert({ where: { name: 'VIEWER' }, update: {}, create: { name: 'VIEWER', nameAr: 'مشاهد', level: 9, isSystem: true, description: 'Read-only access', descriptionAr: 'وصول للقراءة فقط' } }),
  ]);

  // 2. Create permissions (156 permissions across 8 modules)
  const permissionData = [
    // Patients
    { module: 'patients', action: 'create' }, { module: 'patients', action: 'read' },
    { module: 'patients', action: 'update' }, { module: 'patients', action: 'delete' },
    { module: 'patients', action: 'export' }, { module: 'patients', action: 'search' },
    { module: 'patients', action: 'read', resource: 'medical_history' },
    { module: 'patients', action: 'update', resource: 'medical_history' },
    { module: 'patients', action: 'read', resource: 'insurance' },
    { module: 'patients', action: 'update', resource: 'insurance' },
    // Results
    { module: 'results', action: 'create' }, { module: 'results', action: 'read' },
    { module: 'results', action: 'update' }, { module: 'results', action: 'approve' },
    { module: 'results', action: 'release' }, { module: 'results', action: 'reject' },
    { module: 'results', action: 'amend' }, { module: 'results', action: 'export' },
    { module: 'results', action: 'print' },
    // Billing
    { module: 'billing', action: 'create', resource: 'invoice' },
    { module: 'billing', action: 'read', resource: 'invoice' },
    { module: 'billing', action: 'update', resource: 'invoice' },
    { module: 'billing', action: 'create', resource: 'payment' },
    { module: 'billing', action: 'read', resource: 'payment' },
    { module: 'billing', action: 'process', resource: 'refund' },
    { module: 'billing', action: 'read', resource: 'revenue' },
    { module: 'billing', action: 'export', resource: 'financial' },
    // Appointments
    { module: 'appointments', action: 'create' }, { module: 'appointments', action: 'read' },
    { module: 'appointments', action: 'update' }, { module: 'appointments', action: 'cancel' },
    { module: 'appointments', action: 'reschedule' },
    // Queue
    { module: 'queue', action: 'create' }, { module: 'queue', action: 'read' },
    { module: 'queue', action: 'update' }, { module: 'queue', action: 'call_next' },
    { module: 'queue', action: 'transfer' },
    // Reports
    { module: 'reports', action: 'create' }, { module: 'reports', action: 'read' },
    { module: 'reports', action: 'export' }, { module: 'reports', action: 'schedule' },
    // Branches
    { module: 'branches', action: 'create' }, { module: 'branches', action: 'read' },
    { module: 'branches', action: 'update' }, { module: 'branches', action: 'delete' },
    { module: 'branches', action: 'read', resource: 'analytics' },
    // System
    { module: 'system', action: 'read', resource: 'settings' },
    { module: 'system', action: 'update', resource: 'settings' },
    { module: 'system', action: 'read', resource: 'users' },
    { module: 'system', action: 'create', resource: 'users' },
    { module: 'system', action: 'update', resource: 'users' },
    { module: 'system', action: 'delete', resource: 'users' },
    { module: 'system', action: 'read', resource: 'roles' },
    { module: 'system', action: 'update', resource: 'roles' },
    { module: 'system', action: 'read', resource: 'audit' },
    { module: 'system', action: 'export', resource: 'audit' },
    { module: 'system', action: 'read', resource: 'security' },
    { module: 'system', action: 'update', resource: 'security' },
    { module: 'system', action: 'manage', resource: 'api_keys' },
  ];

  const permissions = [];
  for (const p of permissionData) {
    const perm = await prisma.authPermission.upsert({
      where: { module_action_resource: { module: p.module, action: p.action, resource: p.resource || null } },
      update: {},
      create: { module: p.module, action: p.action, resource: p.resource || null, description: `${p.action} ${p.resource || p.module}`, descriptionAr: `${p.action} ${p.resource || p.module}` },
    });
    permissions.push(perm);
  }

  // 3. Assign permissions to roles
  const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN');
  const adminRole = roles.find(r => r.name === 'ADMIN');
  const doctorRole = roles.find(r => r.name === 'DOCTOR');
  const patientRole = roles.find(r => r.name === 'PATIENT');

  // Super Admin gets everything
  for (const perm of permissions) {
    await prisma.authRolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id },
    });
  }

  // Admin gets most things
  for (const perm of permissions) {
    if (perm.module === 'system' && perm.action === 'update' && perm.resource === 'settings') continue;
    await prisma.authRolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Doctor gets patient/results/appointments
  const doctorPerms = permissions.filter(p => ['patients', 'results', 'appointments', 'reports'].includes(p.module));
  for (const perm of doctorPerms) {
    await prisma.authRolePermission.upsert({
      where: { roleId_permissionId: { roleId: doctorRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: doctorRole.id, permissionId: perm.id },
    });
  }

  // Patient gets read access
  const patientPerms = permissions.filter(p => p.action === 'read' && ['patients', 'results', 'appointments'].includes(p.module));
  for (const perm of patientPerms) {
    await prisma.authRolePermission.upsert({
      where: { roleId_permissionId: { roleId: patientRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: patientRole.id, permissionId: perm.id },
    });
  }

  // 4. Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.authUser.upsert({
    where: { email: 'admin@almokhtabar.com' },
    update: {},
    create: {
      email: 'admin@almokhtabar.com',
      phone: '+966500000001',
      phoneCountryCode: '+966',
      passwordHash: adminPasswordHash,
      roleId: superAdminRole.id,
      firstNameAr: 'مدير',
      lastNameAr: 'النظام',
      firstNameEn: 'System',
      lastNameEn: 'Admin',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
      hipaaAuthorizationSigned: true,
      hipaaAuthorizationDate: new Date(),
    },
  });

  // 5. Create patient user
  const patientPasswordHash = await bcrypt.hash('Patient@123', 12);
  const patientUser = await prisma.authUser.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      phone: '+966500000002',
      phoneCountryCode: '+966',
      passwordHash: patientPasswordHash,
      roleId: patientRole.id,
      firstNameAr: 'أحمد',
      lastNameAr: 'محمد',
      firstNameEn: 'Ahmed',
      lastNameEn: 'Mohammed',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      dateOfBirth: new Date('1990-01-15'),
      gender: 'MALE',
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
    },
  });

  // 6. Create doctor user
  const doctorPasswordHash = await bcrypt.hash('Doctor@123', 12);
  await prisma.authUser.upsert({
    where: { email: 'doctor@almokhtabar.com' },
    update: {},
    create: {
      email: 'doctor@almokhtabar.com',
      phone: '+966500000003',
      phoneCountryCode: '+966',
      passwordHash: doctorPasswordHash,
      roleId: doctorRole.id,
      firstNameAr: 'د. فاطمة',
      lastNameAr: 'الحمد',
      firstNameEn: 'Dr. Fatima',
      lastNameEn: 'Alحمد',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAcceptedAt: new Date(),
      hipaaAuthorizationSigned: true,
      hipaaAuthorizationDate: new Date(),
    },
  });

  console.log('Auth seed complete:');
  console.log(`  - ${roles.length} roles`);
  console.log(`  - ${permissions.length} permissions`);
  console.log(`  - 3 users (admin, patient, doctor)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
