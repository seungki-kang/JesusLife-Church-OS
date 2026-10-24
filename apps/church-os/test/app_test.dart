import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:churchos_app/main.dart';

void main() {
  testWidgets('prayer stays in app and never claims a real connection', (tester) async {
    await tester.pumpWidget(const ChurchOsApp());
    await tester.tap(find.text('기도').last);
    await tester.pumpAndSettle();
    expect(find.text('나의 기도수첩'), findsOneWidget);
    await tester.tap(find.text('나의 기도수첩'));
    await tester.pumpAndSettle();
    expect(find.byType(DemoNotice), findsOneWidget);
    expect(find.textContaining('실제 조회·저장·재생'), findsOneWidget);
  });

  testWidgets('member has no admin menu; role preview reveals it', (tester) async {
    await tester.pumpWidget(const ChurchOsApp());
    await tester.tap(find.text('내정보').last);
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('church-admin')), findsNothing);
    await tester.tap(find.byType(DropdownButtonFormField<DemoRole>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('교회 관리자').last);
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.byKey(const Key('church-admin')), 200);
    await tester.tap(find.byKey(const Key('church-admin')));
    await tester.pumpAndSettle();
    expect(find.byType(AdminPreview), findsOneWidget);
    expect(find.textContaining('개인 기도수첩·생명일기'), findsOneWidget);
  });

  testWidgets('church switch clears demo authority and academy selection', (tester) async {
    await tester.pumpWidget(const ChurchOsApp());
    await tester.tap(find.text('내정보').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButtonFormField<DemoRole>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('교회 관리자').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byType(SwitchListTile));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButtonFormField<String>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('소망교회').last);
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('church-admin')), findsNothing);
    expect(tester.widget<SwitchListTile>(find.byType(SwitchListTile)).value, isFalse);
    await tester.tap(find.text('홈').last);
    await tester.pumpAndSettle();
    expect(find.text('소망교회 · 홈'), findsOneWidget);
    expect(find.text('JesusLife Academy'), findsNothing);
  });
}
