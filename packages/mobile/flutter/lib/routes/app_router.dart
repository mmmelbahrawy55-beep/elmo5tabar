import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/state/providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/biometric_setup_screen.dart';
import '../screens/splash_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/appointments/appointment_list_screen.dart';
import '../screens/appointments/book_appointment_screen.dart';
import '../screens/appointments/queue_status_screen.dart';
import '../screens/results/result_list_screen.dart';
import '../screens/results/result_detail_screen.dart';
import '../screens/results/result_comparison_screen.dart';
import '../screens/results/health_timeline_screen.dart';
import '../screens/branches/branch_list_screen.dart';
import '../screens/branches/branch_detail_screen.dart';
import '../screens/payments/payments_screen.dart';
import '../screens/payments/payment_screen.dart';
import '../screens/family/family_members_screen.dart';
import '../screens/family/add_family_member_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/medicine/medicine_reminders_screen.dart';
import '../screens/medicine/add_medicine_screen.dart';
import '../screens/ai/ai_assistant_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/settings/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  return AppRouter.createRouter(ref, authState);
});

class AppRouter {
  AppRouter._();

  static GoRouter createRouter(Ref ref, AuthState authState) {
    final isAuthenticated = authState.isAuthenticated;
    return GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: true,
      redirect: (context, state) {
        final isAuthRoute = state.matchedLocation.startsWith('/login') ||
            state.matchedLocation.startsWith('/register') ||
            state.matchedLocation.startsWith('/forgot-password') ||
            state.matchedLocation.startsWith('/biometric-setup');
        if (!isAuthenticated && !isAuthRoute && state.matchedLocation != '/') {
          return '/login';
        }
        if (isAuthenticated && isAuthRoute) {
          return '/';
        }
        return null;
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          pageBuilder: (context, state) => CustomTransitionPage(
            key: state.pageKey,
            child: const LoginScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
          ),
        ),
        GoRoute(
          path: '/register',
          pageBuilder: (context, state) => CustomTransitionPage(
            key: state.pageKey,
            child: const RegisterScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(opacity: animation, child: child);
            },
          ),
        ),
        GoRoute(
          path: '/forgot-password',
          builder: (context, state) => const ForgotPasswordScreen(),
        ),
        GoRoute(
          path: '/biometric-setup',
          builder: (context, state) => const BiometricSetupScreen(),
        ),
        ShellRoute(
          builder: (context, state, child) => AppShell(child: child),
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
            GoRoute(
              path: '/appointments',
              builder: (context, state) => const AppointmentListScreen(),
            ),
            GoRoute(
              path: '/appointments/book',
              builder: (context, state) => const BookAppointmentScreen(),
            ),
            GoRoute(
              path: '/appointments/queue',
              builder: (context, state) => const QueueStatusScreen(),
            ),
            GoRoute(
              path: '/results',
              builder: (context, state) => const ResultListScreen(),
            ),
            GoRoute(
              path: '/results/:id',
              builder: (context, state) => ResultDetailScreen(
                id: state.pathParameters['id']!,
              ),
            ),
            GoRoute(
              path: '/results/comparison',
              builder: (context, state) => const ResultComparisonScreen(),
            ),
            GoRoute(
              path: '/results/timeline',
              builder: (context, state) => const HealthTimelineScreen(),
            ),
            GoRoute(
              path: '/branches',
              builder: (context, state) => const BranchListScreen(),
            ),
            GoRoute(
              path: '/branches/:id',
              builder: (context, state) => BranchDetailScreen(
                id: state.pathParameters['id']!,
              ),
            ),
            GoRoute(
              path: '/payments',
              builder: (context, state) => const PaymentsScreen(),
            ),
            GoRoute(
              path: '/payments/pay',
              builder: (context, state) => const PaymentScreen(),
            ),
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
            GoRoute(
              path: '/profile/edit',
              builder: (context, state) => const EditProfileScreen(),
            ),
            GoRoute(
              path: '/family',
              builder: (context, state) => const FamilyMembersScreen(),
            ),
            GoRoute(
              path: '/family/add',
              builder: (context, state) => const AddFamilyMemberScreen(),
            ),
            GoRoute(
              path: '/family/:id/edit',
              builder: (context, state) => AddFamilyMemberScreen(
                memberId: state.pathParameters['id'],
              ),
            ),
            GoRoute(
              path: '/medicine',
              builder: (context, state) => const MedicineRemindersScreen(),
            ),
            GoRoute(
              path: '/medicine/add',
              builder: (context, state) => const AddMedicineScreen(),
            ),
            GoRoute(
              path: '/medicine/:id/edit',
              builder: (context, state) => AddMedicineScreen(
                medicineId: state.pathParameters['id'],
              ),
            ),
            GoRoute(
              path: '/ai-assistant',
              builder: (context, state) => const AiAssistantScreen(),
            ),
            GoRoute(
              path: '/notifications',
              builder: (context, state) => const NotificationsScreen(),
            ),
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
    );
  }
}

class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    int currentIndex = 0;
    if (location.startsWith('/appointments')) currentIndex = 1;
    else if (location.startsWith('/results')) currentIndex = 2;
    else if (location.startsWith('/profile') ||
        location.startsWith('/settings') ||
        location.startsWith('/family') ||
        location.startsWith('/medicine') ||
        location.startsWith('/ai-assistant')) currentIndex = 3;

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) {
          switch (index) {
            case 0: context.go('/home');
            case 1: context.go('/appointments');
            case 2: context.go('/results');
            case 3: context.go('/profile');
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today_outlined),
            activeIcon: Icon(Icons.calendar_today),
            label: 'المواعيد',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'النتائج',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz_outlined),
            activeIcon: Icon(Icons.more_horiz),
            label: 'المزيد',
          ),
        ],
      ),
    );
  }
}
