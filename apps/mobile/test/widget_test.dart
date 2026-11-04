import 'package:flutter_test/flutter_test.dart';
import 'package:hearth_hill_mobile/main.dart';

void main() {
  testWidgets('shows the cafe welcome foundation', (WidgetTester tester) async {
    await tester.pumpWidget(const HearthHillApp());

    expect(find.text('A little room\nto slow down.'), findsOneWidget);
    expect(find.text('Explore the menu'), findsOneWidget);
  });
}
