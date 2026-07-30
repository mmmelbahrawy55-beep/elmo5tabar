import { Injectable } from '@nestjs/common';
import { SecurityPolicy, PolicyCategory } from './policies-types';

const ALL_POLICIES: SecurityPolicy[] = [
  {
    id: 'POL-AC-001',
    version: '2.0',
    title: 'Access Control Policy',
    titleAr: 'سياسة التحكم في الوصول',
    category: 'access_control' as PolicyCategory,
    status: 'active',
    severity: 'critical',
    effectiveDate: '2026-01-01',
    reviewDate: '2026-07-01',
    owner: 'CISO',
    approvedBy: 'Board of Directors',
    scope: ['ALL_EMPLOYEES', 'CONTRACTORS', 'THIRD_PARTIES', 'ALL_SYSTEMS'],
    summary: 'Defines access control requirements ensuring least privilege and separation of duties.',
    summaryAr: 'تحدد متطلبات التحكم في الوصول.',
    sections: [
      {
        id: 'AC-1', title: 'User Account Management', titleAr: 'إدارة حسابات المستخدمين',
        content: 'All user accounts must be uniquely identified. Shared accounts are prohibited. Inactive accounts disabled after 90 days.',
        contentAr: 'جميع حسابات المستخدمين محددة بشكل فريد. الحسابات المشتركة محظورة.',
        requirements: ['Unique UUID identification', 'No shared accounts', 'Quarterly review', '90-day inactivity disablement'],
      },
      {
        id: 'AC-2', title: 'Role-Based Access Control', titleAr: 'التحكم بالوصول حسب الدور',
        content: 'Access granted based on job function using RBAC with 13 roles and 156+ permissions. Dual approval required.',
        contentAr: 'يتم منح الوصول بناءً على الوظيفة باستخدام RBAC.',
        requirements: ['RBAC with minimum 12 roles', 'Dual approval for role assignment', 'Annual recertification'],
        penalties: 'May result in disciplinary action up to termination.',
      },
      {
        id: 'AC-3', title: 'Multi-Factor Authentication', titleAr: 'المصادقة متعددة العوامل',
        content: 'MFA mandatory for all sensitive system access, administrative interfaces, and remote access.',
        contentAr: 'المصادقة متعددة العوامل إلزامية للأنظمة الحساسة.',
        requirements: ['MFA for all privileged access', 'MFA for remote access', 'TOTP as primary method'],
      },
      {
        id: 'AC-4', title: 'Privileged Access Management', titleAr: 'إدارة الوصول المميز',
        content: 'Privileged accounts strictly controlled. Just-In-Time access for critical systems. All sessions logged.',
        contentAr: 'التحكم الصارم في الحسابات المميزة.',
        requirements: ['JIT access for critical systems', 'All privileged sessions recorded', 'Monthly review'],
        penalties: 'Unauthorized escalation is grounds for immediate termination.',
      },
    ],
    references: ['NIST SP 800-53 AC-1 to AC-25', 'ISO 27001 A.9', 'HIPAA 164.312(a)(1)', 'Saudi NCA ECC-1:2018'],
    lastReviewed: '2026-06-15',
    nextReview: '2026-09-15',
  },
  {
    id: 'POL-CR-001',
    version: '1.5',
    title: 'Cryptography and Key Management Policy',
    titleAr: 'سياسة التشفير وإدارة المفاتيح',
    category: 'cryptography' as PolicyCategory,
    status: 'active',
    severity: 'critical',
    effectiveDate: '2026-01-01',
    reviewDate: '2026-07-01',
    owner: 'Security Team',
    approvedBy: 'CISO',
    scope: ['ALL_SYSTEMS', 'ALL_DATA'],
    summary: 'Cryptographic standards, encryption requirements, and key management procedures.',
    summaryAr: 'معايير التشفير ومتطلبات إدارة المفاتيح.',
    sections: [
      {
        id: 'CR-1', title: 'Encryption Standards', titleAr: 'معايير التشفير',
        content: 'AES-256-GCM for data at rest. TLS 1.3 for data in transit. RSA-2048 or ECDSA P-384 for signatures. SHA-256 for hashing.',
        contentAr: 'AES-256-GCM للبيانات المخزنة. TLS 1.3 للبيانات المنقولة.',
        requirements: ['AES-256-GCM for data at rest', 'TLS 1.3 minimum', 'SHA-256 for hashing', 'RSA-2048 or ECDSA P-384'],
      },
      {
        id: 'CR-2', title: 'Key Rotation', titleAr: 'تدوير المفاتيح',
        content: 'Keys rotated per schedule: JWT 30d, data encryption 90d, backup 180d. Automated rotation in production.',
        contentAr: 'تدوير المفاتيح حسب الجدول: JWT 30 يوماً.',
        requirements: ['JWT keys: 30-day rotation', 'Data keys: 90-day rotation', 'Backup keys: 180-day rotation', 'Audit trail required'],
      },
      {
        id: 'CR-3', title: 'Key Storage', titleAr: 'تخزين المفاتيح',
        content: 'Keys stored in HSM or cloud KMS. Master keys never alongside encrypted data.',
        contentAr: 'تخزين المفاتيح في HSM أو KMS.',
        requirements: ['HSM or KMS for master keys', 'Keys segregated from data', 'Key access logged'],
      },
    ],
    references: ['NIST SP 800-57', 'ISO 27001 A.10', 'Saudi NCA ECC-2:2019'],
    lastReviewed: '2026-06-12',
    nextReview: '2026-09-12',
  },
  {
    id: 'POL-DC-001',
    version: '1.0',
    title: 'Data Classification and Handling Policy',
    titleAr: 'سياسة تصنيف البيانات والتعامل معها',
    category: 'data_classification' as PolicyCategory,
    status: 'active',
    severity: 'critical',
    effectiveDate: '2026-02-01',
    reviewDate: '2026-08-01',
    owner: 'DPO',
    approvedBy: 'CISO',
    scope: ['ALL_EMPLOYEES', 'ALL_SYSTEMS', 'ALL_DATA'],
    summary: 'Defines data classification levels, handling requirements, and data lifecycle management.',
    summaryAr: 'تحدد مستويات تصنيف البيانات ومتطلبات التعامل معها.',
    sections: [
      {
        id: 'DC-1', title: 'Data Classification Levels', titleAr: 'مستويات تصنيف البيانات',
        content: 'Four levels: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED. PHI/PII classified as RESTRICTED. Financial data as CONFIDENTIAL.',
        contentAr: 'أربعة مستويات: عام، داخلي، سري، مقيد.',
        requirements: ['PUBLIC: marketing materials', 'INTERNAL: internal communications', 'CONFIDENTIAL: financial data', 'RESTRICTED: PHI/PII'],
      },
      {
        id: 'DC-2', title: 'Data Handling Requirements', titleAr: 'متطلبات التعامل مع البيانات',
        content: 'RESTRICTED data requires encryption at rest and in transit, MFA access, and full audit trail. CONFIDENTIAL requires encryption and access controls.',
        contentAr: 'البيانات المقيدة تتطلب تشفيراً كاملاً.',
        requirements: ['RESTRICTED: encrypt + MFA + audit', 'CONFIDENTIAL: encrypt + access control', 'INTERNAL: access control', 'PUBLIC: no restrictions'],
      },
      {
        id: 'DC-3', title: 'Data Retention and Disposal', titleAr: 'الاحتفاظ بالبيانات والتخلص منها',
        content: 'RESTRICTED data retained 7 years per Saudi regulations. CONFIDENTIAL retained 5 years. Disposal via cryptographic erasure or physical destruction.',
        contentAr: 'البيانات المقيدة تحتفظ بها 7 سنوات.',
        requirements: ['RESTRICTED: 7 year retention', 'CONFIDENTIAL: 5 year retention', 'Crypto-shredding for digital disposal'],
      },
    ],
    references: ['GDPR Art 5', 'HIPAA 164.316', 'Saudi PDPL', 'NIST SP 800-53'],
    lastReviewed: '2026-06-01',
    nextReview: '2026-09-01',
  },
  {
    id: 'POL-IR-001',
    version: '1.0',
    title: 'Incident Response Policy',
    titleAr: 'سياسة الاستجابة للحوادث',
    category: 'incident_response' as PolicyCategory,
    status: 'active',
    severity: 'critical',
    effectiveDate: '2026-01-01',
    reviewDate: '2026-07-01',
    owner: 'Security Team',
    approvedBy: 'CISO',
    scope: ['ALL_EMPLOYEES', 'ALL_SYSTEMS'],
    summary: 'Defines incident response lifecycle: detection, triage, containment, remediation, recovery, and post-mortem.',
    summaryAr: 'تحدد دورة الاستجابة للحوادث.',
    sections: [
      {
        id: 'IR-1', title: 'Incident Classification', titleAr: 'تصنيف الحوادث',
        content: 'Severity levels: LOW (no data impact), MEDIUM (minor data exposure), HIGH (PHI exposure), CRITICAL (breach/system compromise). SLA: CRITICAL 1h, HIGH 4h, MEDIUM 24h, LOW 72h.',
        contentAr: 'مستويات الخطورة: منخفض، متوسط، عالٍ، حرج.',
        requirements: ['Critical: 1 hour response SLA', 'High: 4 hour response SLA', 'Medium: 24 hour SLA', 'Low: 72 hour SLA'],
      },
      {
        id: 'IR-2', title: 'Response Procedures', titleAr: 'إجراءات الاستجابة',
        content: 'All incidents follow playbook-driven response. Automated containment for critical threats. Manual approval for irreversible actions.',
        contentAr: 'جميع الحوادث تتبع استجابة مدفوعة بدليل الإجراءات.',
        requirements: ['Playbook-driven for all incidents', 'Automated containment for critical', 'Manual approval for irreversible actions', 'Post-mortem within 48 hours'],
      },
      {
        id: 'IR-3', title: 'Notification and Reporting', titleAr: 'الإبلاغ والإخطار',
        content: 'Data breaches reported to NCSC within 6 hours. GDPR breaches to authority within 72 hours. Patients notified within 24 hours of confirmed PHI breach.',
        contentAr: 'يتم الإبلاغ عن اختراقات البيانات خلال 6 ساعات.',
        requirements: ['NCSC: 6 hour notification', 'GDPR authority: 72 hours', 'Patient notification: 24 hours', 'Internal reporting: immediate'],
      },
    ],
    references: ['NIST SP 800-61', 'ISO 27001 A.16', 'HIPAA 164.308(a)(6)', 'Saudi NCA CSCC'],
    lastReviewed: '2026-06-20',
    nextReview: '2026-09-20',
  },
  {
    id: 'POL-BU-001',
    version: '1.0',
    title: 'Backup and Disaster Recovery Policy',
    titleAr: 'سياسة النسخ الاحتياطي والتعافي من الكوارث',
    category: 'backup_dr' as PolicyCategory,
    status: 'active',
    severity: 'critical',
    effectiveDate: '2026-01-01',
    reviewDate: '2026-07-01',
    owner: 'IT Director',
    approvedBy: 'CISO',
    scope: ['ALL_SYSTEMS', 'ALL_DATA'],
    summary: 'Defines backup schedule, retention, DR plans, and business continuity requirements.',
    summaryAr: 'تحدد جدول النسخ الاحتياطي والتعافي من الكوارث.',
    sections: [
      {
        id: 'BU-1', title: 'Backup Requirements', titleAr: 'متطلبات النسخ الاحتياطي',
        content: 'Full backup weekly, incremental daily, PITR continuous. Backups encrypted AES-256-GCM. 3-2-1 rule: 3 copies, 2 media, 1 offsite.',
        contentAr: 'نسخ احتياطي كامل أسبوعياً، تدريجي يومياً.',
        requirements: ['Weekly full backup', 'Daily incremental', 'Continuous WAL archiving for PITR', '3-2-1 backup rule', 'Offsite backup required'],
      },
      {
        id: 'BU-2', title: 'Retention Schedule', titleAr: 'جدول الاحتفاظ',
        content: 'Daily backups retained 30 days. Weekly full retained 90 days. Monthly full retained 1 year. Annual full retained 7 years.',
        contentAr: 'النسخ اليومي يحتفظ به 30 يوماً.',
        requirements: ['Daily: 30 days', 'Weekly: 90 days', 'Monthly: 1 year', 'Annual: 7 years'],
      },
      {
        id: 'BU-3', title: 'Disaster Recovery', titleAr: 'التعافي من الكوارث',
        content: 'DR plans for datacenter failure (RTO 4h, RPO 15min), ransomware (RTO 24h, RPO 4h), data corruption (RTO 2h, RPO 15min). Quarterly tabletop exercises.',
        contentAr: 'خطط التعافي من الكوارث.',
        requirements: ['Datacenter DR: RTO 4h, RPO 15min', 'Ransomware DR: RTO 24h, RPO 4h', 'Data corruption: RTO 2h, RPO 15min', 'Quarterly DR testing', 'Annual full failover test'],
      },
    ],
    references: ['NIST SP 800-34', 'ISO 27001 A.17', 'HIPAA 164.308(a)(7)'],
    lastReviewed: '2026-06-18',
    nextReview: '2026-09-18',
  },
  {
    id: 'POL-NS-001',
    version: '1.0',
    title: 'Network Security Policy',
    titleAr: 'سياسة أمن الشبكات',
    category: 'network_security' as PolicyCategory,
    status: 'active',
    severity: 'critical',
    effectiveDate: '2026-01-01',
    reviewDate: '2026-07-01',
    owner: 'Security Team',
    approvedBy: 'CISO',
    scope: ['ALL_SYSTEMS', 'ALL_NETWORKS'],
    summary: 'Defines network security architecture, segmentation, monitoring, and access controls.',
    summaryAr: 'تحدد معمارية أمن الشبكات.',
    sections: [
      {
        id: 'NS-1', title: 'Network Segmentation', titleAr: 'تقسيم الشبكة',
        content: 'Production, staging, development networks isolated. DMZ for public-facing services. PCI, PHI, and internal segments separated. Zero-trust architecture enforced.',
        contentAr: 'الشبكات الإنتاجية معزولة.',
        requirements: ['Production / staging / dev isolation', 'DMZ for public services', 'PCI and PHI segmentation', 'Zero-trust architecture'],
      },
      {
        id: 'NS-2', title: 'Firewall and WAF', titleAr: 'جدار الحماية و WAF',
        content: 'WAF with OWASP CRS rules at paranoia level 2. DDoS protection with rate limiting. Egress filtering to prevent data exfiltration.',
        contentAr: 'WAF مع قواعد OWASP CRS.',
        requirements: ['WAF with OWASP CRS level 2', 'DDoS mitigation', 'Egress filtering', 'Monthly rule review'],
      },
    ],
    references: ['NIST SP 800-41', 'ISO 27001 A.13', 'Saudi NCA ECC-1:2018'],
    lastReviewed: '2026-06-10',
    nextReview: '2026-09-10',
  },
  {
    id: 'POL-PR-001',
    version: '1.0',
    title: 'Privacy Policy',
    titleAr: 'سياسة الخصوصية',
    category: 'privacy' as PolicyCategory,
    status: 'active',
    severity: 'critical',
    effectiveDate: '2026-01-01',
    reviewDate: '2026-07-01',
    owner: 'DPO',
    approvedBy: 'Legal',
    scope: ['ALL_EMPLOYEES', 'ALL_PATIENTS', 'ALL_USERS'],
    summary: 'Defines privacy requirements for handling personal and health information.',
    summaryAr: 'تحدد متطلبات الخصوصية للتعامل مع المعلومات الشخصية.',
    sections: [
      {
        id: 'PR-1', title: 'Consent Management', titleAr: 'إدارة الموافقة',
        content: 'Explicit consent required before data collection. Consent recorded with timestamp and version. User can withdraw consent at any time.',
        contentAr: 'الموافقة الصريحة مطلوبة قبل جمع البيانات.',
        requirements: ['Explicit consent before collection', 'Consent recorded in audit trail', 'Right to withdraw honored within 24h'],
      },
      {
        id: 'PR-2', title: 'Data Subject Rights', titleAr: 'حقوق أصحاب البيانات',
        content: 'Right to access, rectify, erase, port, and restrict processing. All requests processed within 30 days. Identity verification required.',
        contentAr: 'حق الوصول والتصحيح والمحو.',
        requirements: ['Access request within 30 days', 'Erasure request within 30 days', 'Identity verification required', 'Request tracking in audit system'],
      },
    ],
    references: ['GDPR Art 15-21', 'HIPAA 164.502', 'Saudi PDPL', 'CCHI privacy requirements'],
    lastReviewed: '2026-06-05',
    nextReview: '2026-09-05',
  },
  {
    id: 'POL-VM-001',
    version: '1.0',
    title: 'Vendor and Third-Party Security Policy',
    titleAr: 'سياسة أمن البائعين والأطراف الثالثة',
    category: 'vendor_management' as PolicyCategory,
    status: 'active',
    severity: 'high',
    effectiveDate: '2026-03-01',
    reviewDate: '2026-09-01',
    owner: 'Legal',
    approvedBy: 'CISO',
    scope: ['ALL_VENDORS', 'ALL_THIRD_PARTIES'],
    summary: 'Defines security requirements for vendors, contractors, and third-party service providers.',
    summaryAr: 'تحدد متطلبات أمن البائعين.',
    sections: [
      {
        id: 'VM-1', title: 'Vendor Risk Assessment', titleAr: 'تقييم مخاطر البائعين',
        content: 'All vendors undergo security assessment before engagement. High-risk vendors require on-site audit. Annual reassessment for critical vendors.',
        contentAr: 'جميع البائعين يخضعون لتقييم أمني.',
        requirements: ['Pre-engagement assessment', 'On-site audit for high-risk', 'Annual reassessment', 'BAA required for PHI access'],
      },
      {
        id: 'VM-2', title: 'Business Associate Agreements', titleAr: 'اتفاقيات الشركاء التجاريين',
        content: 'All vendors with PHI access must sign BAA. BAA includes breach notification, security requirements, and audit rights.',
        contentAr: 'جميع البائعين مع الوصول إلى المعلومات الصحية يوقعون BAA.',
        requirements: ['BAA required for PHI access', 'Breach notification clause', 'Audit rights clause', 'Annual BAA review'],
      },
    ],
    references: ['HIPAA 164.314(a)(1)', 'ISO 27001 A.15', 'NIST SP 800-53'],
    lastReviewed: '2026-06-01',
    nextReview: '2026-09-01',
  },
];

@Injectable()
export class SecurityPoliciesService {
  getPolicies(): SecurityPolicy[] {
    return ALL_POLICIES;
  }

  getPolicy(id: string): SecurityPolicy | undefined {
    return ALL_POLICIES.find((p) => p.id === id);
  }

  getPoliciesByCategory(category: PolicyCategory): SecurityPolicy[] {
    return ALL_POLICIES.filter((p) => p.category === category);
  }

  getActivePolicies(): SecurityPolicy[] {
    return ALL_POLICIES.filter((p) => p.status === 'active');
  }

  getPoliciesDueForReview(daysUntilDue = 30): SecurityPolicy[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysUntilDue);
    return ALL_POLICIES.filter((p) => p.status === 'active' && new Date(p.nextReview) <= cutoff);
  }

  getPolicyCount(): { total: number; byCategory: Record<string, number>; byStatus: Record<string, number> } {
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const p of ALL_POLICIES) {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    }
    return { total: ALL_POLICIES.length, byCategory, byStatus };
  }
}
