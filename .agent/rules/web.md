---
trigger: always_on
---

# Frontend & Mobile Development Rules

## 1. Frontend Frameworks

### 1.1 React (18+)
**Project Structure:**
```
src/
├── components/
│   ├── ui/
│   └── features/
├── hooks/
├── services/
├── store/
├── types/
└── utils/
```

**Standards:**
- ❌ **No inline styles**, use Tailwind or CSS Modules
- ✅ **Component size:** Single component should not exceed 200 lines
- ✅ **Hook dependencies:** useEffect/useMemo must explicitly list all dependencies
- ✅ **Performance optimization:**
  ```javascript
  // Always use key prop
  {items.map(item => <Item key={item.id} {...item} />)}
  
  // Virtual scrolling for large lists
  import { FixedSizeList } from 'react-window';
  
  // Memoization
  const MemoizedChild = React.memo(Child);
  ```

### 1.2 Vue (3+)
**Project Structure:**
```
src/
├── components/
├── composables/
├── views/
├── stores/
└── types/
```

**Standards:**
- ✅ Prefer `<script setup>` syntax
- ✅ Props must define types:
  ```vue
  <script setup lang="ts">
  interface Props {
    title: string;
    count?: number;
  }
  const props = withDefaults(defineProps<Props>(), {
    count: 0
  });
  </script>
  ```

### 1.3 Angular (16+)
**Standards:**
- ✅ Use Standalone Components
- ✅ Strict TypeScript mode (`strict: true`)
- ✅ RxJS streams must unsubscribe or use `async` pipe

---

## 2. Mobile Development

### 2.1 React Native
**Standards:**
- ✅ Use Expo (unless native modules required)
- ✅ Layout uses Flexbox (no Grid)
- ✅ Image optimization: `<Image>` component must set dimensions
- ✅ Performance:
  ```javascript
  <FlatList
    data={items}
    renderItem={({ item }) => <Item {...item} />}
    keyExtractor={item => item.id}
    removeClippedSubviews={true}
  />
  ```

### 2.2 Flutter
**Standards:**
- ✅ Follow Dart naming conventions (lowerCamelCase)
- ✅ Widget tree depth should not exceed 10 layers
- ✅ Use `const` constructors:
  ```dart
  const Text('Hello')
  ```

---

## 3. Frontend Performance Patterns

**Performance Thresholds:**
- 🔴 **CRITICAL (> 50 items):** Use virtual scrolling (react-window/react-virtualized)
- 🟡 **WARNING (> 20 items):** Consider pagination or infinite scroll
- 🟢 **OK (< 20 items):** Standard rendering is fine

1. **Image Optimization:**
   - Must set `width` and `height` attributes
   - Use WebP format
   - Lazy loading: `<img loading="lazy" />`
   - Responsive images (`srcset`)

2. **Code Splitting:**
   ```javascript
   // React
   const Dashboard = React.lazy(() => import('./Dashboard'));
   // Vue
   const Dashboard = defineAsyncComponent(() => import('./Dashboard.vue'));
   ```

3. **State Updates:**
   - Avoid multiple re-renders (batch updates)
   - Use `useMemo` / `computed` for derived state

---

## 4. Framework-Specific Patterns

### 4.1 React Best Practices
**State Management Selection:**
- **Local:** `useState`
- **Complex:** `useReducer`
- **Global (Simple):** Context API
- **App-wide:** Zustand (preferred over Redux for medium apps)

**Custom Hooks Pattern:**
Encapsulate logic in `useHook` naming convention.

### 4.2 Vue 3 Best Practices
**Composables Pattern:**
Use `useFeature` composables instead of Mixins.

### 4.3 Next.js Best Practices
- **Server Components:** Default for data fetching.
- **Client Components:** Use `'use client'` for interactivity (`useState`, `useEffect`).

---

## 5. Accessibility Deep Dive (Code)

### 5.1 Keyboard Navigation
- Interactive elements must be focusable (`tabIndex={0}` if not native button).
- Handle `onKeyDown` (Enter/Space) for custom controls.

### 5.2 ARIA Labels
- `role="status"` for loading states.
- `role="alert"` for errors.
- `aria-label` for icon-only buttons.
- `aria-describedby` for error messages linked to inputs.

### 5.3 Color Contrast
- Ensure text meets WCAG AA (4.5:1) standards.

---

## 6. Frontend Testing
- **Unit Testing:** `jest` + `testing-library`
- **Integration Testing:** Test user flows (e.g., click button -> see result).
- **Test Coverage:** 80%+ for business logic, 100% for utils.