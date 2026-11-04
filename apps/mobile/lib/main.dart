import 'package:flutter/material.dart';

void main() => runApp(const HearthHillApp());

class HearthHillApp extends StatelessWidget {
  const HearthHillApp({super.key});

  @override
  Widget build(BuildContext context) {
    const espresso = Color(0xFF34251E);
    const cream = Color(0xFFF7F3E9);
    const terracotta = Color(0xFF91442F);
    const sage = Color(0xFF536146);

    return MaterialApp(
      title: 'Hearth & Hill',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: terracotta,
          primary: terracotta,
          secondary: sage,
          surface: cream,
        ),
        scaffoldBackgroundColor: cream,
        useMaterial3: true,
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: espresso,
            fontFamily: 'Georgia',
            fontSize: 42,
            height: 1.05,
          ),
          bodyLarge: TextStyle(color: espresso, height: 1.6),
        ),
      ),
      home: const CafeHomePage(),
    );
  }
}

class CafeHomePage extends StatelessWidget {
  const CafeHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFF91442F)),
                        ),
                        child: const Text(
                          'h',
                          style: TextStyle(
                            color: Color(0xFF91442F),
                            fontFamily: 'Georgia',
                            fontSize: 25,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                      const SizedBox(width: 11),
                      const Text(
                        'hearth & hill',
                        style: TextStyle(
                          color: Color(0xFF34251E),
                          fontFamily: 'Georgia',
                          fontSize: 22,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 72),
                  const Text(
                    'YOUR NEIGHBORHOOD, AT ITS OWN PACE',
                    style: TextStyle(
                      color: Color(0xFF536146),
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text('A little room\nto slow down.',
                      style: Theme.of(context).textTheme.headlineLarge),
                  const SizedBox(height: 18),
                  Text(
                    'Thoughtful coffee, something warm from the oven, '
                    'and a place that feels like yours.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 34),
                  FilledButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.arrow_downward_rounded),
                    label: const Text('Explore the menu'),
                  ),
                  const SizedBox(height: 70),
                  const Divider(color: Color(0x3378695E)),
                  const SizedBox(height: 16),
                  const Text(
                    'A THOUGHTFUL FIRST STEP',
                    style: TextStyle(
                      color: Color(0xFF536146),
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 9),
                  const Text(
                    'Mobile beginnings',
                    style: TextStyle(
                      color: Color(0xFF34251E),
                      fontFamily: 'Georgia',
                      fontSize: 25,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'The cafe mobile experience will grow here. '
                    'This Phase 1 app connects to no customer or order data.',
                    style: TextStyle(color: Color(0xFF5B4539), height: 1.6),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
