import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

void main() => runApp(const ChurchOsApp());

enum DemoRole { member, pastor, admin }

class ChurchOsApp extends StatelessWidget {
  const ChurchOsApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'ChurchOS',
    debugShowCheckedModeBanner: false,
    locale: const Locale('ko'),
    supportedLocales: const [Locale('ko')],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff245b4b)),
      useMaterial3: true,
    ),
    home: const ChurchHome(),
  );
}

class ChurchHome extends StatefulWidget {
  const ChurchHome({super.key});

  @override
  State<ChurchHome> createState() => _ChurchHomeState();
}

class _ChurchHomeState extends State<ChurchHome> {
  int _tab = 0;
  bool _academy = false;
  DemoRole _role = DemoRole.member;
  String _church = '은혜교회';
  static const _titles = ['홈', '말씀', '기도', '교회생활', '내정보'];

  void _open(String title, String explanation) {
    Navigator.of(context).push(MaterialPageRoute<void>(
      builder: (_) => Scaffold(
        appBar: AppBar(title: Text(title)),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          const DemoNotice(),
          const SizedBox(height: 24),
          Text(title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          Text(explanation),
          const SizedBox(height: 24),
          const Text('현재는 화면 흐름을 확인하는 단계입니다. 실제 조회·저장·재생·제품 이동은 연결되지 않았습니다.'),
        ]),
      ),
    ));
  }

  Widget _item(String title, String subtitle, IconData icon) => Card(
    child: ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => _open(title, subtitle),
    ),
  );

  List<Widget> _content() {
    switch (_tab) {
      case 0:
        return [
          Text('함께 예배하고, 함께 살아가는 교회', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          const Text('오늘 우리 교회의 소식을 확인하세요.'),
          _item('교회 공지', '게시된 공지를 확인합니다. 실제 API 미연결', Icons.campaign_outlined),
          _item('이번 주 예배와 일정', '예배·모임·봉사 일정을 확인합니다.', Icons.calendar_month_outlined),
          _item('이번 주 설교', '영상 연결·본문·승인된 요약과 나눔지', Icons.play_circle_outline),
          _item('함께 기도해요', 'JLPrayer로 관리하는 교회 공동기도', Icons.favorite_outline),
          if (_academy) _item('JesusLife Academy', '선택한 교육 과정과 실천 안내', Icons.school_outlined),
        ];
      case 1:
        return [
          _item('성경', '교회 앱 안에서 읽기 · JLBible 콘텐츠 연결 예정', Icons.menu_book_outlined),
          _item('찬송', '판본별 제공 가능한 가사·악보·음원 연결 예정', Icons.music_note_outlined),
          _item('설교', '교회 설교 영상·음성·원고', Icons.play_circle_outline),
          _item('말씀 나눔지', '목회자가 검토·승인한 요약과 질문', Icons.article_outlined),
          _item('JLBible 통독', '통독 계획과 진도는 JLBible에서 관리 · 이동 미연결', Icons.open_in_new),
        ];
      case 2:
        return [
          const Text('기도 기록은 JLPrayer에서 관리합니다. 개인 기도는 교회 관리자에게 자동 공유되지 않습니다.'),
          _item('나의 기도수첩', '본인 기도제목과 응답 기록 · 실제 기록 없음', Icons.lock_outline),
          _item('우리 교회 기도', '공개범위에 맞는 공동 기도와 참여', Icons.groups_outlined),
          _item('공동체 기도방', '허용된 목장·팀의 기도방', Icons.forum_outlined),
        ];
      case 3:
        return [
          _item('내 공동체', '목장·팀의 교회 활동', Icons.groups_outlined),
          _item('출석과 참여', '행사 참석 · 영적 성장 점수와 구분', Icons.how_to_reg_outlined),
          _item('내 봉사', '자원한 봉사와 배치 일정', Icons.volunteer_activism_outlined),
          _item('너랑나랑', '관계 문답과 은혜 기록은 전문 앱에서', Icons.open_in_new),
          _item('생명일기', '개인 기록은 전문 앱에서 · 작성 상태를 가져오지 않습니다.', Icons.open_in_new),
          if (_academy) _item('JesusLife Academy', '교육→너랑나랑→생명일기 실천 연결', Icons.school_outlined),
        ];
      default:
        return [
          const Text('데모 설정', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const Text('아래 선택은 화면 시연용이며 실제 계정·교회 권한을 변경하지 않습니다.'),
          DropdownButtonFormField<DemoRole>(
            key: ValueKey('role-${_role.name}'),
            initialValue: _role,
            decoration: const InputDecoration(labelText: '시연 역할'),
            items: const [
              DropdownMenuItem(value: DemoRole.member, child: Text('교인')),
              DropdownMenuItem(value: DemoRole.pastor, child: Text('목회자')),
              DropdownMenuItem(value: DemoRole.admin, child: Text('교회 관리자')),
            ],
            onChanged: (value) { if (value != null) setState(() => _role = value); },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            key: ValueKey('church-$_church'),
            initialValue: _church,
            decoration: const InputDecoration(labelText: '시연 교회'),
            items: const [
              DropdownMenuItem(value: '은혜교회', child: Text('은혜교회')),
              DropdownMenuItem(value: '소망교회', child: Text('소망교회')),
            ],
            onChanged: (value) {
              if (value == null || value == _church) return;
              setState(() { _church = value; _role = DemoRole.member; _academy = false; });
            },
          ),
          SwitchListTile(
            title: const Text('Academy 참여 교회 시연'),
            subtitle: const Text('참여 교회에만 교육 메뉴 표시 · 실제 계약과 무관'),
            value: _academy,
            onChanged: (value) => setState(() => _academy = value),
          ),
          _item('연결과 동의', '제품별 연결·철회·계정 관리를 구분합니다.', Icons.link),
          if (_role != DemoRole.member)
            _item('목회 업무', '허용된 공동체·후속 업무 · 개인 원문 제외', Icons.assignment_outlined),
          if (_role == DemoRole.admin)
            ListTile(
              key: const Key('church-admin'),
              leading: const Icon(Icons.admin_panel_settings_outlined),
              title: const Text('교회 관리'),
              subtitle: const Text('웹 없이 앱에서 관리 · 시연 화면'),
              onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const AdminPreview())),
            ),
        ];
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('$_church · ${_titles[_tab]}')),
    body: SafeArea(child: Column(children: [
      const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: DemoNotice()),
      Expanded(child: ListView(
        padding: const EdgeInsets.all(16),
        children: _content(),
      )),
    ])),
    bottomNavigationBar: NavigationBar(
      selectedIndex: _tab,
      onDestinationSelected: (index) => setState(() => _tab = index),
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_outlined), label: '홈'),
        NavigationDestination(icon: Icon(Icons.menu_book_outlined), label: '말씀'),
        NavigationDestination(icon: Icon(Icons.favorite_outline), label: '기도'),
        NavigationDestination(icon: Icon(Icons.groups_outlined), label: '교회생활'),
        NavigationDestination(icon: Icon(Icons.person_outline), label: '내정보'),
      ],
    ),
  );
}

class DemoNotice extends StatelessWidget {
  const DemoNotice({super.key});
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.secondaryContainer,
      borderRadius: BorderRadius.circular(12),
    ),
    child: const Text('화면 시연 · 실제 로그인·API·저장·재생 미연결'),
  );
}

class AdminPreview extends StatelessWidget {
  const AdminPreview({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('교회 관리')),
    body: ListView(padding: const EdgeInsets.all(16), children: [
      const DemoNotice(),
      const SizedBox(height: 16),
      for (final title in ['교회 정보와 브랜드', '가입 승인·교인·역할', '공지·일정 관리', '설교·나눔지 검토', '공동기도 공개 요청', '제품 연결', '파일 사용량과 감사'])
        ListTile(title: Text(title), subtitle: const Text('구현 예정 · 실제 변경 없음')),
      const SizedBox(height: 16),
      const Text('개인 기도수첩·생명일기·너랑나랑 원문은 교회 관리자 메뉴에서 조회하지 않습니다.'),
    ]),
  );
}
