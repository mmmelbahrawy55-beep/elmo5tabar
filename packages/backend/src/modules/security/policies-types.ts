import { Injectable } from '@nestjs/common';

export type PolicyCategory = 'access_control' | 'cryptography' | 'data_classification' | 'incident_response' | 'backup_dr' | 'network_security' | 'physical_security' | 'vendor_management' | 'acceptable_use' | 'privacy' | 'audit_compliance' | 'change_management';
export type PolicyStatus = 'active' | 'draft' | 'review' | 'superseded' | 'archived';
export type PolicySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityPolicy {
  id: string;
  version: string;
  title: string;
  titleAr: string;
  category: PolicyCategory;
  status: PolicyStatus;
  severity: PolicySeverity;
  effectiveDate: string;
  reviewDate: string;
  owner: string;
  approvedBy: string;
  scope: string[];
  summary: string;
  summaryAr: string;
  sections: PolicySection[];
  references: string[];
  lastReviewed: string;
  nextReview: string;
}

export interface PolicySection {
  id: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  requirements: string[];
  penalties?: string;
}
