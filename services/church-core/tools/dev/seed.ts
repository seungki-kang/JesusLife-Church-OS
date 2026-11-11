/**
 * Synthetic development data (S02/S03). Every church name carries "(시험)" and every person is a
 * synthetic-* subject under the synthetic issuer, so nothing here can be mistaken for real data.
 */
import type { Client } from 'pg';
import { SYNTHETIC_ISSUER } from '../../src/adapters/oidc/config.js';

export const CHURCHES = {
  grace: { id: '0a000000-0000-4000-8000-00000000000a', slug: 'synthetic-grace', name: '은혜교회(시험)' },
  hope: { id: '0b000000-0000-4000-8000-00000000000b', slug: 'synthetic-hope', name: '소망교회(시험)' },
} as const;

type Seat = Readonly<{ church: keyof typeof CHURCHES; status: 'ACTIVE' | 'PENDING'; role?: string; revoked?: boolean }>;
export const SUBJECTS: readonly Readonly<{ subject: string; description: string; seats: readonly Seat[] }>[] = [
  {
    subject: 'synthetic-admin',
    description: '은혜교회 관리자',
    seats: [{ church: 'grace', status: 'ACTIVE', role: 'TENANT_ADMIN' }],
  },
  {
    subject: 'synthetic-pastor',
    description: '은혜교회 목회자',
    seats: [{ church: 'grace', status: 'ACTIVE', role: 'PASTOR' }],
  },
  {
    subject: 'synthetic-member',
    description: '은혜교회·소망교회 교인 (여러 교회 소속)',
    seats: [
      { church: 'grace', status: 'ACTIVE' },
      { church: 'hope', status: 'ACTIVE' },
    ],
  },
  { subject: 'synthetic-pending', description: '은혜교회 가입 대기', seats: [{ church: 'grace', status: 'PENDING' }] },
  {
    subject: 'synthetic-revoked',
    description: '은혜교회 연결 해제됨',
    seats: [{ church: 'grace', status: 'ACTIVE', revoked: true }],
  },
  {
    subject: 'synthetic-hope-admin',
    description: '소망교회 관리자',
    seats: [{ church: 'hope', status: 'ACTIVE', role: 'TENANT_ADMIN' }],
  },
  { subject: 'synthetic-stranger', description: '어느 교회에도 소속 없음', seats: [] },
];

/** Seeds with a privileged connection (RLS bypass) into a freshly migrated database. */
export async function seed(db: Client) {
  for (const c of Object.values(CHURCHES))
    await db.query(
      `insert into church_core.tenant(id,slug,name,status,timezone) values($1,$2,$3,'ACTIVE','Asia/Seoul')`,
      [c.id, c.slug, c.name],
    );
  for (const church of Object.values(CHURCHES))
    for (const code of ['TENANT_ADMIN', 'PASTOR'])
      await db.query(`insert into church_access.tenant_role(tenant_id,code) values($1,$2)`, [church.id, code]);
  for (const person of SUBJECTS)
    for (const seat of person.seats) {
      const tenant = CHURCHES[seat.church].id;
      const m = await db.query(
        `insert into church_core.membership(tenant_id,person_ref,status,joined_on) values($1,gen_random_uuid(),$2,case when $2='ACTIVE' then current_date end) returning id`,
        [tenant, seat.status],
      );
      const membership = m.rows[0].id;
      await db.query(
        `insert into church_access.external_subject_binding(tenant_id,membership_id,issuer,subject_ref,status,revoked_at) values($1,$2,$3,$4,$5,$6)`,
        [
          tenant,
          membership,
          SYNTHETIC_ISSUER,
          person.subject,
          seat.revoked ? 'REVOKED' : 'ACTIVE',
          seat.revoked ? new Date() : null,
        ],
      );
      if (seat.role)
        await db.query(
          `insert into church_access.membership_role(tenant_id,membership_id,role_id) select $1,$2,id from church_access.tenant_role where tenant_id=$1 and code=$3`,
          [tenant, membership, seat.role],
        );
    }
  const grace = CHURCHES.grace.id,
    hope = CHURCHES.hope.id;
  const notices: [string, string, string, string, string][] = [
    [grace, '이번 주 주보 안내(시험)', '시험용 공지입니다.', 'ALL_MEMBERS', `now()-interval '2 hours'`],
    [grace, '새가족 환영 모임(시험)', '시험용 공지입니다.', 'ALL_MEMBERS', `now()-interval '2 days'`],
    [grace, '리더 모임 공지(시험)', '리더 대상 시험 공지입니다.', 'LEADERS', `now()-interval '1 day'`],
    [grace, '교역자 회의(시험)', '교역자 대상 시험 공지입니다.', 'STAFF', `now()-interval '3 hours'`],
    [hope, '소망교회 소식(시험)', '시험용 공지입니다.', 'ALL_MEMBERS', `now()-interval '5 hours'`],
  ];
  for (const [tenant, title, body, audience, at] of notices)
    await db.query(
      `insert into church_core.notice(tenant_id,title,body,audience,status,publish_at) values($1,$2,$3,$4,'PUBLISHED',${at})`,
      [tenant, title, body, audience],
    );
  await db.query(
    `insert into church_core.notice(tenant_id,title,body,audience,status,publish_at) values($1,'작성 중인 공지(시험 초안)','초안','ALL_MEMBERS','DRAFT',now())`,
    [grace],
  );
  const events: [string, string, string, string, string, string][] = [
    [
      grace,
      'WORSHIP',
      '주일 예배(시험)',
      `date_trunc('day',now())+interval '3 days 11 hours'`,
      'PUBLISHED',
      `interval '90 minutes'`,
    ],
    [
      grace,
      'GATHERING',
      '수요 기도회(시험)',
      `date_trunc('day',now())+interval '1 day 19 hours 30 minutes'`,
      'PUBLISHED',
      `interval '1 hour'`,
    ],
    [grace, 'CLASS', '지난 성경 공부(시험)', `now()-interval '3 days'`, 'PUBLISHED', `interval '2 hours'`],
    [grace, 'SERVICE', '봉사 일정 초안(시험)', `now()+interval '10 days'`, 'DRAFT', `interval '2 hours'`],
    [
      hope,
      'WORSHIP',
      '소망교회 주일 예배(시험)',
      `date_trunc('day',now())+interval '3 days 10 hours'`,
      'PUBLISHED',
      `interval '1 hour'`,
    ],
  ];
  for (const [tenant, kind, title, starts, status, length] of events)
    await db.query(
      `insert into church_core.church_event(tenant_id,kind,title,starts_at,ends_at,timezone,status) values($1,$2,$3,${starts},${starts}+${length},'Asia/Seoul',$4)`,
      [tenant, kind, title, status],
    );
}
