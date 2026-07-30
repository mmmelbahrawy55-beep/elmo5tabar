import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WAFRule {
  id: string;
  name: string;
  phase: 'request' | 'response';
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'block' | 'challenge' | 'log' | 'rate_limit';
  patterns: RegExp[];
  target: 'uri' | 'headers' | 'body' | 'cookies' | 'query';
  description: string;
  enabled: boolean;
  score?: number;
}

export interface DDoSProtectionConfig {
  enabled: boolean;
  rateLimits: {
    perIP: number;
    perUser: number;
    perEndpoint: Record<string, number>;
    burstMultiplier: number;
  };
  connectionLimits: {
    maxConnectionsPerIP: number;
    maxRequestsPerSecond: number;
    maxConcurrentRequests: number;
  };
  challengeThresholds: {
    requestsPerMinute: number;
    requestsPerSecond: number;
    newConnectionsPerSecond: number;
  };
  mitigationActions: ('rate_limit' | 'challenge' | 'block' | 'scrubbing')[];
}

export interface WAFConfig {
  enabled: boolean;
  mode: 'block' | 'detect' | 'simulate';
  paranoiaLevel: 1 | 2 | 3 | 4;
  rules: WAFRule[];
  customRules: WAFRule[];
  ipWhitelist: string[];
  ipBlacklist: string[];
  countryBlocklist: string[];
  countryAllowlist: string[];
  ddos: DDoSProtectionConfig;
  botProtection: {
    enabled: boolean;
    allowList: string[];
    blockList: string[];
    challengeThreshold: number;
  };
  apiProtection: {
    enabled: boolean;
    schemaValidation: boolean;
    maxBodySize: number;
    maxParameterLength: number;
    blockMalformedJson: boolean;
    blockSuspiciousMethods: boolean;
  };
}

@Injectable()
export class WAFConfigService {
  constructor(private readonly configService: ConfigService) {}

  getConfig(): WAFConfig {
    return {
      enabled: true,
      mode: 'block',
      paranoiaLevel: 2,
      rules: this.getOWASPCRSRules(),
      customRules: this.getCustomRules(),
      ipWhitelist: this.configService.get<string>('WAF_IP_WHITELIST', '').split(',').filter(Boolean),
      ipBlacklist: this.configService.get<string>('WAF_IP_BLACKLIST', '').split(',').filter(Boolean),
      countryBlocklist: ['KP', 'IR', 'SY', 'CU'],
      countryAllowlist: ['SA', 'AE', 'BH', 'QA', 'OM', 'KW', 'EG', 'JO', 'LB'],
      ddos: {
        enabled: true,
        rateLimits: {
          perIP: 100,
          perUser: 500,
          perEndpoint: {
            '/api/v1/auth/login': 10,
            '/api/v1/auth/register': 5,
            '/api/v1/auth/otp/send': 5,
            '/api/v1/payments': 30,
            '/api/v1/results': 60,
            '/api/graphql': 50,
            'default': 200,
          },
          burstMultiplier: 2,
        },
        connectionLimits: {
          maxConnectionsPerIP: 50,
          maxRequestsPerSecond: 1000,
          maxConcurrentRequests: 500,
        },
        challengeThresholds: {
          requestsPerMinute: 300,
          requestsPerSecond: 50,
          newConnectionsPerSecond: 100,
        },
        mitigationActions: ['rate_limit', 'challenge', 'block', 'scrubbing'],
      },
      botProtection: {
        enabled: true,
        allowList: [
          'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
          'YandexBot', 'Sogou', 'facebookexternalhit', 'Twitterbot',
          'WhatsApp', 'LinkedInBot', 'Applebot', 'Google-PageRenderer',
        ],
        blockList: [
          'curl', 'wget', 'python-requests', 'Go-http-client',
          'Java', 'libwww-perl', 'scrapy', 'masscan', 'nmap',
          'sqlmap', 'nikto', 'ZAP', 'Arachni', 'OpenVAS',
          'nessus', 'acunetix', 'netsparker', 'wpscan',
        ],
        challengeThreshold: 50,
      },
      apiProtection: {
        enabled: true,
        schemaValidation: true,
        maxBodySize: 1048576,
        maxParameterLength: 500,
        blockMalformedJson: true,
        blockSuspiciousMethods: true,
      },
    };
  }

  getOWASPCRSRules(): WAFRule[] {
    return [
      // SQL Injection
      { id: 'OWASP-942100', name: 'SQL Injection - Union Based', phase: 'request', severity: 'critical', action: 'block', patterns: [/\bUNION\s+(ALL\s+)?SELECT\b/i, /\bSELECT\s+.*\bFROM\b/i, /\bINSERT\s+INTO\b/i, /\bDELETE\s+FROM\b/i, /\bDROP\s+TABLE\b/i, /\bOR\s+1\s*=\s*1\b/i, /'?\s*OR\s+'\w+'\s*=\s*'\w+/i, /;\s*DROP\s+TABLE/i, /--\s*$/m, /\/\*!\d+\s+[\w\s]+\*\//, /\bWAITFOR\s+DELAY\b/i, /\bpg_sleep\b/i, /\bbenchmark\s*\(/i], target: 'query', description: 'SQL Injection Attack', enabled: true, score: 100 },
      { id: 'OWASP-942200', name: 'SQL Injection - Blind', phase: 'request', severity: 'critical', action: 'block', patterns: [/\bSLEEP\s*\(\d+\)/i, /\bBENCHMARK\s*\(\d+/, /1\s*=\s*1\s*--/, /'\)\s*OR\s*1\s*=\s*1/i, /\bAND\s+\d+=\d+/i, /\bOR\s+\d+=\d+/i], target: 'query', description: 'Blind SQL Injection', enabled: true, score: 100 },

      // XSS
      { id: 'OWASP-941100', name: 'Cross-Site Scripting - Script Tag', phase: 'request', severity: 'critical', action: 'block', patterns: [ /<script[\s>]/i, /<script\b[^>]*>.*?<\/script\s*>/is, /javascript\s*:/i, /<img\s+[^>]*\bonerror\s*=/i, /<svg\s+[^>]*\bonload\s*=/i, /<body\s+[^>]*\bonload\s*=/i, /<[^>]*\bon\w+\s*=\s*['"]?[^'"]*['"]?/i, /expression\s*\(/i, /vbscript\s*:/i, /data\s*:\s*text\/html/i, /<iframe\s+[^>]*src\s*=/i, /<embed\s+[^>]*src\s*=/i ], target: 'uri', description: 'Cross-Site Scripting (XSS)', enabled: true, score: 100 },
      { id: 'OWASP-941200', name: 'XSS - Event Handlers', phase: 'request', severity: 'high', action: 'block', patterns: [ /\bon\w+\s*=\s*['"]/i, /\bjavascript\s*:/i, /\bonerror\s*=/, /\bonload\s*=/, /\bonclick\s*=/, /\bonmouseover\s*=/, /\bonfocus\s*=/, /\bonchange\s*=/ ], target: 'headers', description: 'XSS via Event Handlers', enabled: true, score: 90 },

      // Path Traversal
      { id: 'OWASP-930100', name: 'Path Traversal', phase: 'request', severity: 'high', action: 'block', patterns: [ /\.\.\//, /\.\.\\/, /\.\.%2f/i, /\.\.%5c/i, /%2e%2e%2f/i, /%252e%252e%252f/i, /\betc\/passwd\b/, /\bwindows\/system32\b/i, /\bboot\.ini\b/i, /\bweb\.config\b/i, /\b\.env\b/, /\bcomposer\.json\b/, /\bpackage\.json\b/, /\bnode_modules\b/ ], target: 'uri', description: 'Path Traversal Attack', enabled: true, score: 90 },

      // Command Injection
      { id: 'OWASP-932100', name: 'Remote Command Execution', phase: 'request', severity: 'critical', action: 'block', patterns: [ /\bexec\s*\(/i, /\bsystem\s*\(/i, /\bpassthru\s*\(/i, /\bshell_exec\s*\(/i, /\|/i, /;\s*\`/, /;\s*\$\(/, /`[^`]+`/, /\|\s*cat\s+/i, /\|\s*curl\s+/i, /\|\s*wget\s+/i, /\|\s*nc\s+/i, /\|\s*nmap\s+/i, /\|\s*perl\s+/i, /\|\s*python\s+/i, /\|\s*sh\s+/i, /\|\s*bash\s+/i ], target: 'query', description: 'Remote Command Execution', enabled: true, score: 100 },
      { id: 'OWASP-932200', name: 'Code Injection', phase: 'request', severity: 'critical', action: 'block', patterns: [ /base64_decode\s*\(/i, /eval\s*\(/i, /assert\s*\(/i, /create_function/i, /preg_replace\s*\(\s*['"].*\/e['"]/i, /\bGLOBALS\b/i, /\b_REQUEST\b/i, /\b_SERVER\b/i, /\b_COOKIE\b/i, /\b_FILES\b/i, /\b_ENV\b/i ], target: 'body', description: 'PHP/JS Code Injection', enabled: true, score: 100 },

      // LFI/RFI
      { id: 'OWASP-931100', name: 'Local File Inclusion', phase: 'request', severity: 'high', action: 'block', patterns: [ /\.\.\//, /\.\.\\/, /\binclude\s*\(/i, /\brequire\s*\(/i, /\binclude_once\s*\(/i, /\brequire_once\s*\(/i, /\bphp:\/\/input\b/i, /\bphp:\/\/filter\b/i, /\bphp:\/\/temp\b/i, /\bdata:\/\/\b/i, /\bexpect:\/\/\b/i ], target: 'uri', description: 'Local/Remote File Inclusion', enabled: true, score: 90 },

      // HTTP Method Manipulation
      { id: 'OWASP-911100', name: 'HTTP Method Tampering', phase: 'request', severity: 'medium', action: 'block', patterns: [ /^(CONNECT|TRACE|TRACK|OPTIONS|PUT|DELETE|PATCH)\s/i ], target: 'uri', description: 'HTTP Method Manipulation', enabled: true, score: 70 },

      // Sensitive Data Exposure
      { id: 'OWASP-934100', name: 'Sensitive Data in URL', phase: 'request', severity: 'high', action: 'log', patterns: [ /password\s*=/i, /secret\s*=/i, /token\s*=/i, /apikey\s*=/i, /api_key\s*=/i, /access_token\s*=/i, /jwt\s*=/i, /auth\s*=/i, /passwd\s*=/i, /credential\s*=/i, /ssn\s*=/i, /credit_card\s*=/i, /cvv\s*=/i, /pin\s*=/i ], target: 'query', description: 'Sensitive Data Exposure in URL', enabled: true, score: 80 },

      // IP Spoofing
      { id: 'OWASP-933100', name: 'IP Spoofing Headers', phase: 'request', severity: 'medium', action: 'log', patterns: [ /^127\.0\.0\.1$/, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./ ], target: 'headers', description: 'IP Spoofing Attempt via Headers', enabled: true, score: 60 },

      // Response Splitting
      { id: 'OWASP-943100', name: 'HTTP Response Splitting', phase: 'request', severity: 'high', action: 'block', patterns: [ /\r\n/, /%0d%0a/i, /%0D%0A/i, /\n\n/, /\r\r/ ], target: 'headers', description: 'HTTP Response Splitting Attack', enabled: true, score: 85 },

      // SSRF
      { id: 'OWASP-918100', name: 'Server-Side Request Forgery', phase: 'request', severity: 'high', action: 'block', patterns: [ /^https?:\/\/(169\.254|127\.|10\.|172\.(1[6-9]|2\d|3[01])|192\.168)/, /^https?:\/\/localhost/i, /^https?:\/\/0\.0\.0\.0/, /^https?:\/\/metadata\.google\.internal/i, /^https?:\/\/169\.254\.169\.254/, /^https?:\/\/100\.100\.100\.200/ ], target: 'query', description: 'Server-Side Request Forgery', enabled: true, score: 90 },

      // Deserialization
      { id: 'OWASP-944100', name: 'Insecure Deserialization', phase: 'request', severity: 'high', action: 'block', patterns: [ /O:\d+:/, /a:\d+:\{/, /s:\d+:"[^"]+"/, /rO0AB/, /yO4AB/, /H4sI/ ], target: 'body', description: 'Insecure Deserialization Attempt', enabled: true, score: 85 },
    ];
  }

  getCustomRules(): WAFRule[] {
    return [
      {
        id: 'CUSTOM-001', name: 'Saudi PHI Data Protection', phase: 'request', severity: 'critical', action: 'block',
        patterns: [ /\b\d{10}\b/, /\b\d{15}\b/, /\bsaudi\s+national\s+id\b/i, /\bidentity\s+number\b/i ],
        target: 'body', description: 'Block PHI data in non-encrypted requests', enabled: true, score: 100,
      },
      {
        id: 'CUSTOM-002', name: 'API Key Leakage Prevention', phase: 'response', severity: 'high', action: 'log',
        patterns: [ /(?:sk_live_|pk_live_|sk_test_|pk_test_)[\w]{10,}/, /(?:AKIA|ASIA)[\w]{16}/, /ghp_[\w]{36}/, /xox[baprs]-[\w]{10,}/, /(?:SG\.[\w-]{20,})/, /(?:key-|secret-)[\w]{20,}/ ],
        target: 'body', description: 'Detect API key leakage in responses', enabled: true, score: 100,
      },
      {
        id: 'CUSTOM-003', name: 'Mass Assignment Protection', phase: 'request', severity: 'high', action: 'block',
        patterns: [ /role\s*=/i, /permissions\s*=/i, /is_admin\s*=/i, /is_superuser\s*=/i, /account_type\s*=/i ],
        target: 'body', description: 'Block mass assignment attack patterns', enabled: true, score: 90,
      },
      {
        id: 'CUSTOM-004', name: 'GraphQL Introspection Block', phase: 'request', severity: 'medium', action: 'block',
        patterns: [ /__schema\b/, /__type\b/, /introspection/i ],
        target: 'body', description: 'Block GraphQL introspection in production', enabled: true, score: 70,
      },
      {
        id: 'CUSTOM-005', name: 'Brute Force Login Detection', phase: 'request', severity: 'high', action: 'rate_limit',
        patterns: [ /\/api\/v\d+\/auth\/login/, /\/api\/v\d+\/auth\/otp/ ],
        target: 'uri', description: 'Rate limit authentication endpoints', enabled: true, score: 85,
      },
      {
        id: 'CUSTOM-006', name: 'Admin Panel Protection', phase: 'request', severity: 'critical', action: 'block',
        patterns: [ /\/wp-admin/, /\/administrator/, /\/admin\/login/, /\/phpmyadmin/, /\/_debug/, /\/\.git\//, /\/\.svn\//, /\/\.env/, /\/composer\.json/, /\/artisan/, /\/console\b/, /\/swagger\/static\// ],
        target: 'uri', description: 'Protect admin and debug endpoints', enabled: true, score: 100,
      },
      {
        id: 'CUSTOM-007', name: 'Large Payload Protection', phase: 'request', severity: 'medium', action: 'block',
        patterns: [ /.{1000000,}/s ],
        target: 'body', description: 'Block request bodies larger than 1MB', enabled: true, score: 60,
      },
      {
        id: 'CUSTOM-008', name: 'Null Byte Injection', phase: 'request', severity: 'high', action: 'block',
        patterns: [ /%00/, /\x00/, /\\x00/i ],
        target: 'uri', description: 'Block null byte injection attempts', enabled: true, score: 90,
      },
      {
        id: 'CUSTOM-009', name: 'Unicode Normalization Attack', phase: 'request', severity: 'medium', action: 'block',
        patterns: [ /%c0%ae/i, /%c0%af/i, /%c1%9c/i, /%ef%bc%8f/i, /%e2%80%ae/i ],
        target: 'uri', description: 'Block unicode normalization attacks', enabled: true, score: 75,
      },
      {
        id: 'CUSTOM-010', name: 'JWT Token Abuse Protection', phase: 'request', severity: 'high', action: 'block',
        patterns: [ /alg\s*:\s*["']none["']/i, /alg\s*:\s*["']HS256["']\s*,\s*["']kid["']\s*:/i, /\{"\s*"\s*:\s*"none/i ],
        target: 'headers', description: 'Block JWT algorithm confusion attacks', enabled: true, score: 95,
      },
    ];
  }

  evaluateRequest(request: {
    method: string;
    uri: string;
    headers: Record<string, string>;
    body?: string;
    query?: string;
    ip: string;
  }): { blocked: boolean; action: string; ruleId: string; score: number; reason: string } {
    const config = this.getConfig();

    if (config.countryBlocklist.length > 0 && request.headers['cf-ipcountry']) {
      const country = request.headers['cf-ipcountry'].toUpperCase();
      if (config.countryBlocklist.includes(country)) {
        return { blocked: true, action: 'block', ruleId: 'GEO-BLOCK', score: 100, reason: `Country blocked: ${country}` };
      }
    }

    if (config.ipBlacklist.includes(request.ip)) {
      return { blocked: true, action: 'block', ruleId: 'IP-BLOCK', score: 100, reason: `IP blacklisted: ${request.ip}` };
    }

    if (config.ipWhitelist.includes(request.ip)) {
      return { blocked: false, action: 'pass', ruleId: 'IP-ALLOW', score: 0, reason: 'IP whitelisted' };
    }

    if (config.apiProtection.blockSuspiciousMethods && ['CONNECT', 'TRACE', 'TRACK'].includes(request.method.toUpperCase())) {
      return { blocked: true, action: 'block', ruleId: 'HTTP-METHOD', score: 100, reason: `Suspicious HTTP method: ${request.method}` };
    }

    if (config.botProtection.enabled) {
      const ua = (request.headers['user-agent'] || '').toLowerCase();
      for (const bot of config.botProtection.blockList) {
        if (ua.includes(bot.toLowerCase())) {
          return { blocked: true, action: 'block', ruleId: 'BOT-BLOCK', score: 100, reason: `Bot blocked: ${bot}` };
        }
      }
    }

    let highestScore = 0;
    let matchedRule: WAFRule | null = null;

    const allRules = [...config.rules, ...config.customRules];

    for (const rule of allRules) {
      if (!rule.enabled) continue;

      let targetContent = '';
      switch (rule.target) {
        case 'uri':
          targetContent = `${request.method} ${request.uri}`;
          break;
        case 'headers':
          targetContent = Object.entries(request.headers).map(([k, v]) => `${k}: ${v}`).join('\n');
          break;
        case 'body':
          targetContent = request.body || '';
          break;
        case 'cookies':
          targetContent = request.headers['cookie'] || '';
          break;
        case 'query':
          targetContent = new URLSearchParams(request.query || request.uri.split('?')[1] || '').toString();
          break;
      }

      for (const pattern of rule.patterns) {
        if (pattern.test(targetContent)) {
          const score = rule.score || 50;
          if (score > highestScore) {
            highestScore = score;
            matchedRule = rule;
          }
          break;
        }
      }
    }

    if (matchedRule) {
      const action = config.mode === 'detect' ? 'log' : matchedRule.action;
      return {
        blocked: action === 'block',
        action,
        ruleId: matchedRule.id,
        score: highestScore,
        reason: `${matchedRule.description} (${matchedRule.id})`,
      };
    }

    return { blocked: false, action: 'pass', ruleId: '', score: 0, reason: 'No rules matched' };
  }
}

export const wafConfig = new WAFConfigService({} as ConfigService).getConfig();
