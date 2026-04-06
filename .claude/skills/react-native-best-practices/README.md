# 📱 React Native Best Practices Skill

This skill provides comprehensive best practices for React Native development in 2026, specifically tailored for Expo SDK 52+ projects with TypeScript, Zustand, Expo Router, and Supabase.

## 📚 What's Included

### Core Documentation
- **SKILL.md** - Main best practices guide (always loaded)
- Comprehensive coverage of architecture, performance, security, testing, and deployment

### Reference Guides (Loaded as needed)

1. **performance-patterns.md** - Performance optimization deep-dive
   - FlatList/FlashList optimization
   - Memoization strategies
   - Animation performance
   - Memory management
   - Bundle size optimization

2. **state-management.md** - Zustand patterns and best practices
   - Store architecture patterns
   - Selector patterns (basic, shallow, computed)
   - Async actions with error handling
   - Real-time subscriptions
   - Optimistic updates
   - Testing stores

3. **testing-patterns.md** - Complete testing guide
   - Unit testing utilities and hooks
   - Component testing with React Native Testing Library
   - Mocking Supabase, AsyncStorage, SecureStore
   - Integration testing flows
   - Jest configuration
   - Coverage thresholds

4. **project-structure.md** - Architecture and organization
   - Expo Router file-based routing
   - Component organization patterns
   - Service layer patterns
   - Custom hook patterns
   - Type organization
   - Theme configuration

### Quick Reference
- **assets/quick-reference.md** - Do this ✅ vs Don't do this ❌ cheat sheet
- Perfect for quick lookups during development

### Scripts
- **scripts/checklist.sh** - Interactive checklist for code reviews
- Run before PRs to ensure all best practices are followed

## 🎯 When to Use

This skill is automatically invoked when:
- Writing new React Native components
- Reviewing code for best practices
- Refactoring existing code
- Setting up project structure
- Implementing performance optimizations
- Creating test files
- Debugging performance issues

## 📋 Coverage

| Area | Topics Covered |
|------|----------------|
| **Architecture** | Feature-based structure, component design, service layer |
| **Performance** | Memoization, virtualized lists, render optimization |
| **State** | Zustand patterns, selectors, async actions, real-time |
| **TypeScript** | Strict types, type guards, generic patterns |
| **Security** | SecureStore, env vars, RLS, E2E encryption |
| **Testing** | Unit, component, integration, mocking, coverage |
| **Navigation** | Expo Router, route groups, typed navigation |
| **Deployment** | EAS builds, OTA updates, CI/CD |

## 🚀 Quick Start

The skill is already installed and ready to use. Just start coding and I'll automatically apply these best practices!

### Manual Reference

For a quick checklist, run:
```bash
.claude/skills/react-native-best-practices/scripts/checklist.sh
```

## 📖 Stack-Specific Guidance

This skill is tailored for the Cerlita Chat stack:
- **Expo SDK 52** - Latest Expo features
- **TypeScript 5.7** - Strict mode enabled
- **Zustand 5.0** - State management
- **Expo Router 4.0** - File-based routing
- **Supabase** - Backend as a Service
- **React Native Paper** - UI components
- **Reanimated v3** - Animations

## 🔧 Patterns Included

### Performance
- ✅ FlatList optimization for chat messages
- ✅ React.memo for MessageBubble
- ✅ useMemo for sorted/filtered data
- ✅ useCallback for event handlers
- ✅ StyleSheet.create patterns

### State Management
- ✅ Domain-specific stores (chat, user, settings)
- ✅ Selector patterns to prevent re-renders
- ✅ Async actions with error handling
- ✅ Real-time Supabase subscriptions
- ✅ Optimistic updates
- ✅ Persistent settings with AsyncStorage

### Testing
- ✅ Jest configuration
- ✅ Component testing patterns
- ✅ Hook testing with renderHook
- ✅ Supabase mocking
- ✅ Error case coverage
- ✅ User interaction testing

### Security
- ✅ SecureStore for encryption keys
- ✅ Environment variable validation
- ✅ Row Level Security (RLS)
- ✅ E2E encryption patterns
- ✅ No secrets in code/logs

## 💡 Pro Tips

1. **Before writing code**: Review the relevant reference guide
2. **During development**: Keep quick-reference.md handy
3. **Before PRs**: Run the checklist script
4. **When stuck**: Search reference files for patterns

## 📝 Examples Included

- Chat message list with FlatList
- Zustand store with async actions
- Component with proper TypeScript types
- Real-time Supabase subscription
- Error boundary implementation
- Optimistic update pattern
- Test file structure
- Theme configuration

## 🔄 Updates

This skill will be updated as:
- New React Native features are released
- Better patterns are discovered
- Project requirements evolve
- Team feedback is received

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-06  
**Stack**: Expo 52 + TypeScript + Zustand + Supabase
