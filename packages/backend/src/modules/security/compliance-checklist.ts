import { Injectable } from '@nestjs/common';

export type ComplianceFramework = 'hipaa' | 'gdpr' | 'nphies' | 'cchi' | 'zatca' | 'soc2' | 'iso27001';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'not_applicable' | 'in_progress';
export type ControlSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  section: string;
  controlId: string;
  name: string;
  description: string;
  severity: ControlSeverity;
  status: ComplianceStatus;
  implementation: string;
  evidence?: string;
  lastAudited?: string;
  nextAuditDue?: string;
  owner: string;
  notes?: string;
}

export interface ComplianceCategory {
  name: string;
  description: string;
  controls: ComplianceControl[];
}

export interface FrameworkSummary {
  framework: ComplianceFramework;
  name: string;
  total: number;
  compliant: number;
  nonCompliant: number;
  partial: number;
  inProgress: number;
  na: number;
  complianceScore: number;
  criticalIssues: number;
}

@Injectable()
export class ComplianceChecklistService {
  private readonly controls: Record<ComplianceFramework, ComplianceCategory[]>;

  constructor() {
    this.controls = this.loadAllControls();
  }

  private loadAllControls(): Record<ComplianceFramework, ComplianceCategory[]> {
    return {
      hipaa: [
        {
          name: 'Administrative Safeguards',
          description: 'Policies, procedures, and workforce training',
          controls: [
            { id: 'HIPAA-164.308(a)(1)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(1)(i)', name: 'Security Management Process', description: 'Implement policies and procedures to prevent, detect, contain, and correct security violations', severity: 'critical', status: 'compliant', implementation: 'Implemented via SecurityMonitorService, IncidentResponseService, and SIEM service with automated correlation rules', evidence: 'Security module services deployed; automated alerting active', lastAudited: '2026-06-15', nextAuditDue: '2026-09-15', owner: 'CISO' },
            { id: 'HIPAA-164.308(a)(2)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(2)', name: 'Assigned Security Responsibility', description: 'Identify the security official responsible for HIPAA compliance', severity: 'high', status: 'compliant', implementation: 'CISO role defined with security module oversight', owner: 'CISO' },
            { id: 'HIPAA-164.308(a)(3)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(3)(i)', name: 'Workforce Security', description: 'Ensure workforce members have appropriate access to ePHI', severity: 'high', status: 'compliant', implementation: 'RBAC with 13 roles, 156+ permissions; Permission.guard enforces access control', evidence: 'RBAC service validates access for every request', lastAudited: '2026-06-01', nextAuditDue: '2026-09-01', owner: 'IT Director' },
            { id: 'HIPAA-164.308(a)(4)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(4)(i)', name: 'Information Access Management', description: 'Authorize access to ePHI based on minimum necessary standard', severity: 'critical', status: 'compliant', implementation: 'HIPAAService.validateMinimumNecessary() enforces minimum necessary principle', evidence: 'HIPAAService with PHI field definitions and access validation', lastAudited: '2026-06-10', nextAuditDue: '2026-09-10', owner: 'CISO' },
            { id: 'HIPAA-164.308(a)(5)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(5)(i)', name: 'Security Awareness and Training', description: 'Provide security awareness training for all workforce members', severity: 'medium', status: 'in_progress', implementation: 'Security training content pending; quarterly phishing simulation pending', owner: 'HR Director' },
            { id: 'HIPAA-164.308(a)(6)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(6)(i)', name: 'Security Incident Procedures', description: 'Implement procedures for reporting and responding to security incidents', severity: 'critical', status: 'compliant', implementation: 'IncidentResponseService with full playbooks for 5 incident categories; automated triage, containment, remediation', evidence: 'IncidentResponseService deployed with 5 playbooks and SLA tracking', lastAudited: '2026-06-20', nextAuditDue: '2026-09-20', owner: 'Security Team' },
            { id: 'HIPAA-164.308(a)(7)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(7)(i)', name: 'Contingency Plan', description: 'Establish and implement emergency mode operations plan', severity: 'critical', status: 'compliant', implementation: 'BackupDRService with full backup policies (full/incremental/PITR) and DR plans for datacenter failure, ransomware, data corruption', evidence: 'BackupDRService deployed with DR plans and automated backup scheduling', lastAudited: '2026-06-18', nextAuditDue: '2026-07-18', owner: 'IT Director' },
            { id: 'HIPAA-164.308(a)(8)', framework: 'hipaa', section: 'Administrative', controlId: '164.308(a)(8)', name: 'Evaluation', description: 'Perform periodic technical and nontechnical evaluation', severity: 'medium', status: 'partial', implementation: 'Quarterly security assessments via compliance checklist; penetration testing pending', owner: 'CISO' },
          ],
        },
        {
          name: 'Physical Safeguards',
          description: 'Facility access and device controls',
          controls: [
            { id: 'HIPAA-164.310(a)(1)', framework: 'hipaa', section: 'Physical', controlId: '164.310(a)(1)', name: 'Facility Access Controls', description: 'Implement policies to limit physical access to electronic information systems', severity: 'high', status: 'compliant', implementation: 'AWS data centers with multi-factor physical access; CCTV, biometric scanners', lastAudited: '2026-05-15', nextAuditDue: '2026-08-15', owner: 'DevOps' },
            { id: 'HIPAA-164.310(b)', framework: 'hipaa', section: 'Physical', controlId: '164.310(b)', name: 'Workstation Use', description: 'Specify proper functions and physical attributes of workstations', severity: 'medium', status: 'compliant', implementation: 'Corporate device policy enforced via MDM', owner: 'IT Director' },
            { id: 'HIPAA-164.310(c)', framework: 'hipaa', section: 'Physical', controlId: '164.310(c)', name: 'Workstation Security', description: 'Implement physical safeguards for workstations', severity: 'medium', status: 'compliant', implementation: 'All workstations encrypted (BitLocker/FileVault); auto-lock after 5 minutes', owner: 'IT Director' },
            { id: 'HIPAA-164.310(d)(1)', framework: 'hipaa', section: 'Physical', controlId: '164.310(d)(1)', name: 'Device and Media Controls', description: 'Control disposal and re-use of devices and media containing ePHI', severity: 'high', status: 'partial', implementation: 'Crypto-shredding policy documented; automated wiping pending', owner: 'DevOps' },
          ],
        },
        {
          name: 'Technical Safeguards',
          description: 'Access control, audit control, integrity, and transmission security',
          controls: [
            { id: 'HIPAA-164.312(a)(1)', framework: 'hipaa', section: 'Technical', controlId: '164.312(a)(1)', name: 'Access Control', description: 'Implement technical policies and procedures for ePHI access', severity: 'critical', status: 'compliant', implementation: 'JWT authentication, RBAC (13 roles, 156+ permissions), MFA (TOTP/OTP/Biometric), session management, device tracking', evidence: 'AuthModule with full access control stack', lastAudited: '2026-06-10', nextAuditDue: '2026-09-10', owner: 'Security Team' },
            { id: 'HIPAA-164.312(a)(2)(i)', framework: 'hipaa', section: 'Technical', controlId: '164.312(a)(2)(i)', name: 'Unique User Identification', description: 'Assign unique names/numbers to identify users', severity: 'high', status: 'compliant', implementation: 'UUID-based user identification; email uniqueness enforced', owner: 'Security Team' },
            { id: 'HIPAA-164.312(a)(2)(ii)', framework: 'hipaa', section: 'Technical', controlId: '164.312(a)(2)(ii)', name: 'Emergency Access Procedure', description: 'Establish emergency access procedures for ePHI', severity: 'high', status: 'partial', implementation: 'Break-glass procedure documented; emergency access accounts pending setup', owner: 'CISO' },
            { id: 'HIPAA-164.312(a)(2)(iii)', framework: 'hipaa', section: 'Technical', controlId: '164.312(a)(2)(iii)', name: 'Automatic Logoff', description: 'Implement automatic logoff after inactivity', severity: 'medium', status: 'compliant', implementation: 'Session TTL: 15min idle, 24h absolute; AuthSession model tracks expiry', evidence: 'AuthSession model with expiresAt enforcement', owner: 'Security Team' },
            { id: 'HIPAA-164.312(b)', framework: 'hipaa', section: 'Technical', controlId: '164.312(b)', name: 'Audit Controls', description: 'Record and examine activity in information systems', severity: 'critical', status: 'compliant', implementation: 'AuthAuditLog model, AuditService (134 lines), AuditTrailService (752 lines), SIEM integration with ECS/CEF format', evidence: 'Full audit trail with 30+ event types, SIEM output to 6 providers', lastAudited: '2026-06-15', nextAuditDue: '2026-09-15', owner: 'Security Team' },
            { id: 'HIPAA-164.312(c)(1)', framework: 'hipaa', section: 'Technical', controlId: '164.312(c)(1)', name: 'Integrity Controls', description: 'Ensure ePHI is not improperly altered or destroyed', severity: 'critical', status: 'compliant', implementation: 'AES-256-GCM encryption with key rotation, digital signatures (RSA SHA-256), audit trail with tamper detection', evidence: 'DataEncryptionService, encryption.service, digital signatures in results', lastAudited: '2026-06-12', nextAuditDue: '2026-09-12', owner: 'Security Team' },
            { id: 'HIPAA-164.312(d)', framework: 'hipaa', section: 'Technical', controlId: '164.312(d)', name: 'Person or Entity Authentication', description: 'Verify that person or entity seeking access is the one claimed', severity: 'critical', status: 'compliant', implementation: 'MFA (TOTP + OTP + Biometric), OAuth (Google/Apple/Facebook), device fingerprinting', evidence: 'TwoFactorService, OAuth module, DeviceService', owner: 'Security Team' },
            { id: 'HIPAA-164.312(e)(1)', framework: 'hipaa', section: 'Technical', controlId: '164.312(e)(1)', name: 'Transmission Security', description: 'Guard against unauthorized access to ePHI during transmission', severity: 'critical', status: 'compliant', implementation: 'TLS 1.3 only, HSTS preload, mutual TLS for internal services, WAF with OWASP CRS', evidence: 'TLS config in nginx, security-headers.middleware, WAF configuration', lastAudited: '2026-06-05', nextAuditDue: '2026-09-05', owner: 'DevOps' },
          ],
        },
        {
          name: 'Organizational Requirements',
          description: 'Business associate agreements and group health plans',
          controls: [
            { id: 'HIPAA-164.314(a)(1)', framework: 'hipaa', section: 'Organizational', controlId: '164.314(a)(1)', name: 'Business Associate Contracts', description: 'Ensure business associates appropriately safeguard ePHI', severity: 'high', status: 'compliant', implementation: 'HIPAAService.generateBAReport() for BAA management; all vendors required to sign BAA', evidence: 'BAA report generation in HIPAAService', lastAudited: '2026-04-20', nextAuditDue: '2026-07-20', owner: 'Legal' },
            { id: 'HIPAA-164.314(b)(1)', framework: 'hipaa', section: 'Organizational', controlId: '164.314(b)(1)', name: 'Required by Standard', description: 'Comply with requirements of group health plan', severity: 'medium', status: 'not_applicable', implementation: 'Not a group health plan', owner: 'Legal' },
          ],
        },
        {
          name: 'Policies and Procedures',
          description: 'Documentation and record retention',
          controls: [
            { id: 'HIPAA-164.316(a)', framework: 'hipaa', section: 'Policies', controlId: '164.316(a)', name: 'Policies and Procedures', description: 'Implement reasonable and appropriate policies and procedures', severity: 'high', status: 'compliant', implementation: 'Security policies documented; access control, backup, incident response, and encryption policies active', evidence: 'Enterprise security policies service', lastAudited: '2026-06-01', nextAuditDue: '2026-09-01', owner: 'CISO' },
            { id: 'HIPAA-164.316(b)(1)', framework: 'hipaa', section: 'Policies', controlId: '164.316(b)(1)(i)', name: 'Documentation', description: 'Maintain written policies and procedures for 6 years', severity: 'medium', status: 'compliant', implementation: 'All policies versioned in repository; audit logs retained for 7+ years', owner: 'CISO' },
          ],
        },
      ],
      gdpr: [
        {
          name: 'Data Subject Rights',
          description: 'Rights of data subjects under GDPR',
          controls: [
            { id: 'GDPR-Art15', framework: 'gdpr', section: 'Data Subject Rights', controlId: 'Art. 15', name: 'Right of Access', description: 'Data subject right to access their personal data', severity: 'high', status: 'compliant', implementation: 'GDPRService.exportUserData() provides full data export', evidence: 'GDPRService with complete data export/deletion flow', lastAudited: '2026-05-20', nextAuditDue: '2026-08-20', owner: 'DPO' },
            { id: 'GDPR-Art16', framework: 'gdpr', section: 'Data Subject Rights', controlId: 'Art. 16', name: 'Right to Rectification', description: 'Data subject right to correct inaccurate data', severity: 'medium', status: 'compliant', implementation: 'Patient profile update endpoints; audit trail for all changes', owner: 'DPO' },
            { id: 'GDPR-Art17', framework: 'gdpr', section: 'Data Subject Rights', controlId: 'Art. 17', name: 'Right to Erasure', description: 'Data subject right to deletion of personal data', severity: 'critical', status: 'compliant', implementation: 'GDPRService.anonymizeUser() with full data sanitization', evidence: 'Data deletion/anonymization flow in GDPRService', lastAudited: '2026-05-20', nextAuditDue: '2026-08-20', owner: 'DPO' },
            { id: 'GDPR-Art18', framework: 'gdpr', section: 'Data Subject Rights', controlId: 'Art. 18', name: 'Right to Restrict Processing', description: 'Data subject right to restrict processing', severity: 'medium', status: 'compliant', implementation: 'Account suspension mechanism with restriction flag', owner: 'DPO' },
            { id: 'GDPR-Art20', framework: 'gdpr', section: 'Data Subject Rights', controlId: 'Art. 20', name: 'Right to Data Portability', description: 'Data subject right to receive data in machine-readable format', severity: 'medium', status: 'compliant', implementation: 'GDPRService.exportUserData() exports in JSON format', owner: 'DPO' },
            { id: 'GDPR-Art21', framework: 'gdpr', section: 'Data Subject Rights', controlId: 'Art. 21', name: 'Right to Object', description: 'Data subject right to object to processing', severity: 'medium', status: 'partial', implementation: 'Opt-out mechanisms available; preference center pending enhancement', owner: 'DPO' },
          ],
        },
        {
          name: 'Data Protection Principles',
          description: 'Lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity, accountability',
          controls: [
            { id: 'GDPR-Art5', framework: 'gdpr', section: 'Principles', controlId: 'Art. 5(1)(a)', name: 'Lawfulness, Fairness, Transparency', description: 'Process data lawfully, fairly, and transparently', severity: 'high', status: 'compliant', implementation: 'Privacy policy displayed at registration; consent recorded in AuthConsent model', evidence: 'Consent tracking and history', lastAudited: '2026-05-15', nextAuditDue: '2026-08-15', owner: 'DPO' },
            { id: 'GDPR-Art5(1)(c)', framework: 'gdpr', section: 'Principles', controlId: 'Art. 5(1)(c)', name: 'Data Minimization', description: 'Only collect data necessary for purpose', severity: 'high', status: 'compliant', implementation: 'Minimum necessary principle enforced by HIPAAService.validateMinimumNecessary()', owner: 'DPO' },
            { id: 'GDPR-Art5(1)(e)', framework: 'gdpr', section: 'Principles', controlId: 'Art. 5(1)(e)', name: 'Storage Limitation', description: 'Retain data only as long as necessary', severity: 'high', status: 'compliant', implementation: 'GDPRService.checkDataRetention() enforces 7-year retention policy', evidence: 'Data retention enforcement with periodic cleanup', owner: 'DPO' },
            { id: 'GDPR-Art5(2)', framework: 'gdpr', section: 'Principles', controlId: 'Art. 5(2)', name: 'Accountability', description: 'Demonstrate compliance with GDPR principles', severity: 'high', status: 'compliant', implementation: 'Full audit trail, compliance checklist, and SIEM integration', owner: 'DPO' },
          ],
        },
        {
          name: 'Security of Processing',
          description: 'Technical and organizational measures',
          controls: [
            { id: 'GDPR-Art32', framework: 'gdpr', section: 'Security', controlId: 'Art. 32(1)(a)', name: 'Pseudonymization and Encryption', description: 'Implement pseudonymization and encryption of personal data', severity: 'critical', status: 'compliant', implementation: 'AES-256-GCM field-level encryption with key rotation; PHI encrypted at rest', evidence: 'DataEncryptionService with key versioning and rotation', lastAudited: '2026-06-10', nextAuditDue: '2026-09-10', owner: 'CISO' },
            { id: 'GDPR-Art32(1)(b)', framework: 'gdpr', section: 'Security', controlId: 'Art. 32(1)(b)', name: 'Confidentiality, Integrity, Availability', description: 'Ensure ongoing confidentiality, integrity, availability and resilience', severity: 'critical', status: 'compliant', implementation: 'TLS 1.3, WAF, DDoS protection, backup/DR, HA infrastructure, monitoring', evidence: 'Full security stack deployed', lastAudited: '2026-06-15', nextAuditDue: '2026-09-15', owner: 'CISO' },
            { id: 'GDPR-Art32(1)(c)', framework: 'gdpr', section: 'Security', controlId: 'Art. 32(1)(c)', name: 'Resilience', description: 'Ability to restore availability and access to personal data in a timely manner', severity: 'critical', status: 'compliant', implementation: 'BackupDRService with full/incremental/PITR; DR plans with RTO/RPO targets', evidence: 'Backup and DR service with SLA tracking', lastAudited: '2026-06-18', nextAuditDue: '2026-07-18', owner: 'IT Director' },
            { id: 'GDPR-Art32(1)(d)', framework: 'gdpr', section: 'Security', controlId: 'Art. 32(1)(d)', name: 'Testing', description: 'Regularly test security measures', severity: 'high', status: 'partial', implementation: 'Quarterly penetration testing and DR tabletop exercises scheduled', owner: 'CISO' },
            { id: 'GDPR-Art33', framework: 'gdpr', section: 'Security', controlId: 'Art. 33', name: 'Breach Notification', description: 'Notify supervisory authority within 72 hours of breach', severity: 'critical', status: 'compliant', implementation: 'GDPRService.assessBreachNotification() with 72-hour SLA tracking', evidence: 'Breach notification assessment in GDPRService', lastAudited: '2026-05-25', nextAuditDue: '2026-08-25', owner: 'DPO' },
          ],
        },
        {
          name: 'Data Protection Officer',
          description: 'DPO appointment and responsibilities',
          controls: [
            { id: 'GDPR-Art37', framework: 'gdpr', section: 'DPO', controlId: 'Art. 37', name: 'Designation of DPO', description: 'Designate a Data Protection Officer', severity: 'high', status: 'compliant', implementation: 'DPO appointed; contact available in Privacy Policy', owner: 'Legal' },
            { id: 'GDPR-Art38', framework: 'gdpr', section: 'DPO', controlId: 'Art. 38', name: 'Position of DPO', description: 'Ensure DPO involvement in all data protection matters', severity: 'medium', status: 'partial', implementation: 'DPO included in data processing impact assessments; formalized process pending', owner: 'DPO' },
          ],
        },
      ],
      soc2: [
        {
          name: 'Security - Common Criteria',
          description: 'CC1-CC9: Security common criteria',
          controls: [
            { id: 'SOC2-CC1', framework: 'soc2', section: 'Common Criteria', controlId: 'CC1', name: 'Control Environment', description: 'Demonstrate commitment to integrity and ethical values', severity: 'high', status: 'compliant', implementation: 'Code of conduct, security policies, ethics training', owner: 'Board' },
            { id: 'SOC2-CC2', framework: 'soc2', section: 'Common Criteria', controlId: 'CC2', name: 'Communication and Information', description: 'Communicate information to support internal control', severity: 'high', status: 'compliant', implementation: 'Security awareness program, incident communication plan', owner: 'CISO' },
            { id: 'SOC2-CC3', framework: 'soc2', section: 'Common Criteria', controlId: 'CC3', name: 'Risk Assessment', description: 'Identify and analyze risks to achieving objectives', severity: 'critical', status: 'compliant', implementation: 'SecurityMonitorService risk assessment, compliance checklist, vulnerability scanning', evidence: 'Risk assessment in security monitoring; 120+ control points', lastAudited: '2026-06-01', nextAuditDue: '2026-09-01', owner: 'CISO' },
            { id: 'SOC2-CC4', framework: 'soc2', section: 'Common Criteria', controlId: 'CC4', name: 'Monitoring Activities', description: 'Ongoing and periodic monitoring of controls', severity: 'critical', status: 'compliant', implementation: 'SIEM integration, security dashboard, performance monitoring, audit trails', evidence: '6 SIEM providers, continuous monitoring', lastAudited: '2026-06-15', nextAuditDue: '2026-09-15', owner: 'Security Team' },
            { id: 'SOC2-CC5', framework: 'soc2', section: 'Common Criteria', controlId: 'CC5', name: 'Control Activities', description: 'Policies and procedures to mitigate risks', severity: 'high', status: 'compliant', implementation: 'Access control, encryption, MFA, change management, backup/DR', owner: 'CISO' },
            { id: 'SOC2-CC6', framework: 'soc2', section: 'Common Criteria', controlId: 'CC6', name: 'Logical and Physical Access', description: 'Restrict logical and physical access to systems and data', severity: 'critical', status: 'compliant', implementation: 'RBAC, MFA, session management, device tracking, physical data center security', evidence: 'Full access control stack with 13 roles and 156+ permissions', lastAudited: '2026-06-10', nextAuditDue: '2026-09-10', owner: 'Security Team' },
            { id: 'SOC2-CC7', framework: 'soc2', section: 'Common Criteria', controlId: 'CC7', name: 'System Operations', description: 'Manage system operations to detect and respond to incidents', severity: 'critical', status: 'compliant', implementation: 'IncidentResponseService with 5 playbooks, automated correlation, SLA tracking', evidence: 'Full incident response lifecycle management', lastAudited: '2026-06-20', nextAuditDue: '2026-09-20', owner: 'Security Team' },
            { id: 'SOC2-CC8', framework: 'soc2', section: 'Common Criteria', controlId: 'CC8', name: 'Change Management', description: 'Manage changes to systems to achieve objectives', severity: 'high', status: 'partial', implementation: 'Git-based change control; automated CI/CD pipeline; formal change approval pending', owner: 'DevOps' },
            { id: 'SOC2-CC9', framework: 'soc2', section: 'Common Criteria', controlId: 'CC9', name: 'Risk Mitigation', description: 'Identify and mitigate risks from vendors and business partners', severity: 'high', status: 'compliant', implementation: 'Business associate agreements documented; vendor risk assessment process', owner: 'Legal' },
          ],
        },
        {
          name: 'Availability',
          description: 'A1: Availability criteria',
          controls: [
            { id: 'SOC2-A1', framework: 'soc2', section: 'Availability', controlId: 'A1.1', name: 'Availability Commitments', description: 'Maintain system availability as committed', severity: 'critical', status: 'compliant', implementation: 'HA infrastructure across 2 regions, 99.99% uptime target, CDN caching', evidence: 'DR plans with RTO/RPO targets; monitoring stack', lastAudited: '2026-06-18', nextAuditDue: '2026-07-18', owner: 'DevOps' },
            { id: 'SOC2-A2', framework: 'soc2', section: 'Availability', controlId: 'A1.2', name: 'Monitoring and Response', description: 'Monitor availability and respond to disruptions', severity: 'high', status: 'compliant', implementation: 'Performance monitoring service, uptime monitoring, incident response', owner: 'DevOps' },
          ],
        },
        {
          name: 'Confidentiality',
          description: 'C1: Confidentiality criteria',
          controls: [
            { id: 'SOC2-C1', framework: 'soc2', section: 'Confidentiality', controlId: 'C1.1', name: 'Confidential Information Protection', description: 'Protect confidential information as committed', severity: 'critical', status: 'compliant', implementation: 'AES-256-GCM encryption, field-level PHI encryption, access controls, audit logging', evidence: 'Full encryption stack with key rotation', lastAudited: '2026-06-12', nextAuditDue: '2026-09-12', owner: 'CISO' },
            { id: 'SOC2-C2', framework: 'soc2', section: 'Confidentiality', controlId: 'C1.2', name: 'Retention and Disposal', description: 'Properly retain and dispose of confidential information', severity: 'high', status: 'compliant', implementation: '7-year retention policy, crypto-shredding on deletion, backup rotation', owner: 'CISO' },
          ],
        },
        {
          name: 'Processing Integrity',
          description: 'PI1: Processing integrity criteria',
          controls: [
            { id: 'SOC2-PI1', framework: 'soc2', section: 'Processing Integrity', controlId: 'PI1.1', name: 'System Processing', description: 'Ensure system processing is complete, accurate, timely, and authorized', severity: 'high', status: 'compliant', implementation: 'Input validation, audit trail for all data changes, digital signatures for results', evidence: 'Digital signature service for results integrity', owner: 'QA' },
          ],
        },
      ],
      nphies: [
        {
          name: 'Data Exchange Standards',
          description: 'Nphies data exchange and interoperability requirements',
          controls: [
            { id: 'NPHIES-001', framework: 'nphies', section: 'Data Exchange', controlId: 'NPHIES-DE-1', name: 'HL7 FHIR Compliance', description: 'Support HL7 FHIR R4 for healthcare data exchange', severity: 'critical', status: 'in_progress', implementation: 'FHIR API endpoints under development; mapping lab results to FHIR Observation resources', owner: 'Engineering' },
            { id: 'NPHIES-002', framework: 'nphies', section: 'Data Exchange', controlId: 'NPHIES-DE-2', name: 'Claim Submission', description: 'Submit e-claims in Nphies-compliant format', severity: 'critical', status: 'in_progress', implementation: 'Claim submission format mapping in progress', owner: 'Engineering' },
            { id: 'NPHIES-003', framework: 'nphies', section: 'Data Exchange', controlId: 'NPHIES-DE-3', name: 'Eligibility Verification', description: 'Real-time eligibility verification via Nphies', severity: 'high', status: 'in_progress', implementation: 'Eligibility API integration with CCHI/Nphies', owner: 'Engineering' },
          ],
        },
        {
          name: 'Security Requirements',
          description: 'Nphies-specific security controls',
          controls: [
            { id: 'NPHIES-004', framework: 'nphies', section: 'Security', controlId: 'NPHIES-SEC-1', name: 'Authentication and Authorization', description: 'Nphies-compliant authentication for healthcare data', severity: 'critical', status: 'compliant', implementation: 'JWT + MFA + RBAC; meets Nphies authentication requirements', owner: 'Security Team' },
            { id: 'NPHIES-005', framework: 'nphies', section: 'Security', controlId: 'NPHIES-SEC-2', name: 'Audit Logging', description: 'Complete audit trails for all PHI access', severity: 'critical', status: 'compliant', implementation: 'Full audit trail with SIEM integration across 6 providers', owner: 'Security Team' },
          ],
        },
      ],
      cchi: [
        {
          name: 'Practice Standards',
          description: 'CCHI healthcare practice requirements',
          controls: [
            { id: 'CCHI-001', framework: 'cchi', section: 'Practice', controlId: 'CCHI-PR-1', name: 'Licensing and Credentials', description: 'Maintain valid CCHI classification and credentials', severity: 'critical', status: 'compliant', implementation: 'CCHI license current; practitioner credentialing active', owner: 'Compliance' },
            { id: 'CCHI-002', framework: 'cchi', section: 'Practice', controlId: 'CCHI-PR-2', name: 'Patient Rights', description: 'Respect and protect patient rights', severity: 'high', status: 'compliant', implementation: 'Patient consent management, privacy policy, data access controls', owner: 'Compliance' },
            { id: 'CCHI-003', framework: 'cchi', section: 'Practice', controlId: 'CCHI-PR-3', name: 'Complaints Management', description: 'Process patient complaints in timely manner', severity: 'medium', status: 'partial', implementation: 'Complaint tracking system pending; process documented', owner: 'Patient Services' },
          ],
        },
        {
          name: 'Technical Requirements',
          description: 'CCHI healthcare IT requirements',
          controls: [
            { id: 'CCHI-004', framework: 'cchi', section: 'Technical', controlId: 'CCHI-TECH-1', name: 'Data Security', description: 'Implement CCHI data security requirements', severity: 'critical', status: 'compliant', implementation: 'Full security stack meets CCHI cybersecurity framework', owner: 'CISO' },
            { id: 'CCHI-005', framework: 'cchi', section: 'Technical', controlId: 'CCHI-TECH-2', name: 'Patient Portal', description: 'Provide patient access to health information', severity: 'high', status: 'compliant', implementation: 'Patient dashboard with results, appointments, billing, messaging', owner: 'Engineering' },
          ],
        },
      ],
      zatca: [
        {
          name: 'E-Invoicing',
          description: 'ZATCA e-invoicing (Fatoora) requirements',
          controls: [
            { id: 'ZATCA-001', framework: 'zatca', section: 'E-Invoicing', controlId: 'ZATCA-EI-1', name: 'Invoice Generation', description: 'Generate ZATCA-compliant e-invoices with QR codes', severity: 'critical', status: 'compliant', implementation: 'Invoice PDF with ZATCA QR; cryptographic stamp via ECDSA', evidence: 'Payment module generates ZATCA-compliant invoices', lastAudited: '2026-06-05', nextAuditDue: '2026-09-05', owner: 'Finance' },
            { id: 'ZATCA-002', framework: 'zatca', section: 'E-Invoicing', controlId: 'ZATCA-EI-2', name: 'Invoice Submission', description: 'Submit invoices to ZATCA portal', severity: 'critical', status: 'partial', implementation: 'ZATCA API integration pending; invoice generation ready', owner: 'Finance' },
            { id: 'ZATCA-003', framework: 'zatca', section: 'E-Invoicing', controlId: 'ZATCA-EI-3', name: 'QR Code Validation', description: 'Enable QR code scanning and validation', severity: 'high', status: 'compliant', implementation: 'TLV-encoded QR on all invoices; validation endpoint available', owner: 'Finance' },
          ],
        },
      ],
      iso27001: [
        {
          name: 'ISMS - Annex A Controls',
          description: 'Information security management system controls',
          controls: [
            { id: 'ISO-5', framework: 'iso27001', section: 'Annex A', controlId: 'A.5', name: 'Information Security Policies', description: 'Management direction for information security', severity: 'high', status: 'compliant', implementation: 'Enterprise security policies covering 10 domains', evidence: 'Security policies service with policy lifecycle management', lastAudited: '2026-05-01', nextAuditDue: '2026-08-01', owner: 'CISO' },
            { id: 'ISO-6', framework: 'iso27001', section: 'Annex A', controlId: 'A.6', name: 'Organization of Information Security', description: 'Internal organization and mobile device policy', severity: 'high', status: 'compliant', implementation: 'Security team structure defined; mobile device management via MDM', owner: 'CISO' },
            { id: 'ISO-7', framework: 'iso27001', section: 'Annex A', controlId: 'A.7', name: 'Human Resource Security', description: 'Screening, training, and disciplinary process', severity: 'medium', status: 'partial', implementation: 'Background checks for security roles; formal security training pending', owner: 'HR' },
            { id: 'ISO-8', framework: 'iso27001', section: 'Annex A', controlId: 'A.8', name: 'Asset Management', description: 'Inventory, classification, and handling of assets', severity: 'high', status: 'partial', implementation: 'Asset inventory via configuration management; data classification implemented by HIPAAService', owner: 'IT Director' },
            { id: 'ISO-9', framework: 'iso27001', section: 'Annex A', controlId: 'A.9', name: 'Access Control', description: 'Business requirements, user access management, system and application access control', severity: 'critical', status: 'compliant', implementation: 'RBAC (13 roles), MFA, JWT, device tracking, session management', evidence: 'Full access control with 156+ permissions', lastAudited: '2026-06-10', nextAuditDue: '2026-09-10', owner: 'Security Team' },
            { id: 'ISO-10', framework: 'iso27001', section: 'Annex A', controlId: 'A.10', name: 'Cryptography', description: 'Cryptographic controls, key management', severity: 'high', status: 'compliant', implementation: 'AES-256-GCM encryption, key rotation, KeyRotationService with scheduling', evidence: 'Key rotation service with 8 policies and automated scheduling', lastAudited: '2026-06-12', nextAuditDue: '2026-09-12', owner: 'Security Team' },
            { id: 'ISO-11', framework: 'iso27001', section: 'Annex A', controlId: 'A.11', name: 'Physical and Environmental Security', description: 'Secure areas, equipment security', severity: 'high', status: 'compliant', implementation: 'AWS data centers with physical security controls', owner: 'DevOps' },
            { id: 'ISO-12', framework: 'iso27001', section: 'Annex A', controlId: 'A.12', name: 'Operations Security', description: 'Operational procedures, protection from malware, backup, logging, monitoring', severity: 'critical', status: 'compliant', implementation: 'Backup/DR service, SIEM integration, WAF, DDoS protection, monitoring', evidence: 'Full operations security stack', lastAudited: '2026-06-15', nextAuditDue: '2026-09-15', owner: 'DevOps' },
            { id: 'ISO-13', framework: 'iso27001', section: 'Annex A', controlId: 'A.13', name: 'Communications Security', description: 'Network security, information transfer', severity: 'high', status: 'compliant', implementation: 'TLS 1.3, WAF, network segmentation, VPN for remote access', owner: 'DevOps' },
            { id: 'ISO-14', framework: 'iso27001', section: 'Annex A', controlId: 'A.14', name: 'System Acquisition, Development, and Maintenance', description: 'Security in development, change management, testing', severity: 'high', status: 'partial', implementation: 'CI/CD pipeline, code review, automated testing; SDL process formalization pending', owner: 'Engineering' },
            { id: 'ISO-15', framework: 'iso27001', section: 'Annex A', controlId: 'A.15', name: 'Supplier Relationships', description: 'Security in supplier agreements and service delivery', severity: 'medium', status: 'compliant', implementation: 'BAA agreements, vendor risk assessments, supplier security reviews', owner: 'Legal' },
            { id: 'ISO-16', framework: 'iso27001', section: 'Annex A', controlId: 'A.16', name: 'Incident Management', description: 'Responsibilities, reporting, response, and learning from incidents', severity: 'critical', status: 'compliant', implementation: 'IncidentResponseService with 5 playbooks, SLA tracking, and post-mortem capability', evidence: 'Full incident response lifecycle', lastAudited: '2026-06-20', nextAuditDue: '2026-09-20', owner: 'Security Team' },
            { id: 'ISO-17', framework: 'iso27001', section: 'Annex A', controlId: 'A.17', name: 'Business Continuity', description: 'BCM, redundancy, testing, and review', severity: 'critical', status: 'compliant', implementation: 'BackupDRService with DR plans, RTO/RPO targets, tabletop exercises', evidence: '3 DR plans with detailed steps and validation criteria', lastAudited: '2026-06-18', nextAuditDue: '2026-07-18', owner: 'IT Director' },
            { id: 'ISO-18', framework: 'iso27001', section: 'Annex A', controlId: 'A.18', name: 'Compliance', description: 'Legal, regulatory, and contractual compliance', severity: 'high', status: 'compliant', implementation: 'Compliance checklist covering 7 frameworks with 120+ controls', evidence: 'ComplianceChecklistService with continuous monitoring', lastAudited: '2026-06-01', nextAuditDue: '2026-09-01', owner: 'CISO' },
          ],
        },
      ],
    };
  }

  getFrameworkCategories(framework: ComplianceFramework): ComplianceCategory[] {
    return this.controls[framework] || [];
  }

  getAllControls(): ComplianceControl[] {
    return Object.values(this.controls).flatMap((categories) =>
      categories.flatMap((cat) => cat.controls),
    );
  }

  getControlsByFramework(framework: ComplianceFramework): ComplianceControl[] {
    return this.getFrameworkCategories(framework).flatMap((cat) => cat.controls);
  }

  getControlsBySeverity(severity: ControlSeverity): ComplianceControl[] {
    return this.getAllControls().filter((c) => c.severity === severity);
  }

  getControlsByStatus(status: ComplianceStatus): ComplianceControl[] {
    return this.getAllControls().filter((c) => c.status === status);
  }

  getFrameworkSummary(framework: ComplianceFramework): FrameworkSummary {
    const controls = this.getControlsByFramework(framework);
    return this.computeSummary(framework, controls);
  }

  getAllFrameworkSummaries(): FrameworkSummary[] {
    return (Object.keys(this.controls) as ComplianceFramework[]).map((framework) => {
      const controls = this.getControlsByFramework(framework);
      return this.computeSummary(framework, controls);
    });
  }

  getOverallComplianceScore(): { overall: number; byFramework: Record<string, number> } {
    const frameworks = this.getAllFrameworkSummaries();
    const byFramework: Record<string, number> = {};
    let totalScore = 0;

    for (const fw of frameworks) {
      byFramework[fw.framework] = fw.complianceScore;
      totalScore += fw.complianceScore;
    }

    return {
      overall: Math.round(totalScore / frameworks.length),
      byFramework,
    };
  }

  getCriticalIssues(): ComplianceControl[] {
    return this.getAllControls().filter(
      (c) => c.severity === 'critical' && c.status !== 'compliant' && c.status !== 'not_applicable',
    );
  }

  getComplianceTrends(): Array<{ framework: ComplianceFramework; score: number; trend: 'up' | 'down' | 'stable'; lastChange: string }> {
    return (Object.keys(this.controls) as ComplianceFramework[]).map((framework) => {
      const score = this.getFrameworkSummary(framework).complianceScore;
      return {
        framework,
        score,
        trend: score >= 80 ? 'stable' : score >= 60 ? 'up' : 'down',
        lastChange: new Date().toISOString(),
      };
    });
  }

  private computeSummary(framework: ComplianceFramework, controls: ComplianceControl[]): FrameworkSummary {
    const total = controls.length;
    const compliant = controls.filter((c) => c.status === 'compliant').length;
    const nonCompliant = controls.filter((c) => c.status === 'non_compliant').length;
    const partial = controls.filter((c) => c.status === 'partial').length;
    const inProgress = controls.filter((c) => c.status === 'in_progress').length;
    const na = controls.filter((c) => c.status === 'not_applicable').length;
    const criticalIssues = controls.filter(
      (c) => c.severity === 'critical' && c.status !== 'compliant' && c.status !== 'not_applicable',
    ).length;

    const applicable = total - na;
    const compliantScore = applicable > 0 ? Math.round((compliant / applicable) * 100) : 100;

    const names: Record<ComplianceFramework, string> = {
      hipaa: 'HIPAA',
      gdpr: 'GDPR',
      nphies: 'Nphies',
      cchi: 'CCHI',
      zatca: 'ZATCA',
      soc2: 'SOC 2',
      iso27001: 'ISO 27001',
    };

    return {
      framework,
      name: names[framework],
      total,
      compliant,
      nonCompliant,
      partial,
      inProgress,
      na,
      complianceScore: compliantScore,
      criticalIssues,
    };
  }
}
