# HeathSence Frontend Mobile

HeathSence mobile app built with Expo SDK 57, Expo Router, Gluestack UI v5, and NativeWind v5.

## Tech Stack

- Expo SDK 57
- React Native 0.86
- React 19
- Expo Router
- Gluestack UI v5
- NativeWind v5 with Tailwind CSS v4 tokens
- TypeScript

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run start
```

Start with a clean Metro cache after changing Babel, Metro, NativeWind, or theme config:

```bash
npx expo start -c
```

Run on a specific platform:

```bash
npm run android
npm run ios
npm run web
```

## Project Structure

```txt
src/
  app/
    _layout.tsx
    index.tsx

  components/
    ui/
      gluestack-ui-provider/
        index.tsx
        index.web.tsx
        script.ts

  constants/
    theme.ts

  global.css
```

## Routing

This project uses Expo Router.

- `src/app/_layout.tsx` is the root layout.
- `src/app/index.tsx` is the `/` route.
- Add new screens by adding files under `src/app`.

Example:

```txt
src/app/login.tsx        -> /login
src/app/profile.tsx      -> /profile
src/app/users/[id].tsx   -> /users/:id
```

## UI Provider

The root layout wraps the app with `GluestackUIProvider`:

```tsx
<GluestackUIProvider mode="system">
  <Slot />
</GluestackUIProvider>
```

The provider gives the app shared support for:

- Gluestack overlays
- Toasts
- Light/dark mode
- Root layout sizing

Native uses `index.tsx`; web uses `index.web.tsx`.

## Styling And Theme

Global design tokens live in:

```txt
src/global.css
```

Use NativeWind classes with semantic tokens:

```tsx
bg-background
text-foreground
bg-card
text-primary
bg-secondary
bg-accent
border-border
```

To change the app theme, update the CSS variables in `src/global.css`.

Use `src/constants/theme.ts` only when a component needs colors from TypeScript or `StyleSheet`.

## Path Alias

The `@` alias points to `src`.

```ts
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
```

Do not import from `@/src/...`.

## NativeWind Notes

NativeWind is configured in:

- `babel.config.js`
- `metro.config.js`
- `nativewind-env.d.ts`
- `react-native-css-env.d.ts`

Important: this project uses `nativewind/babel` without `jsxImportSource: 'nativewind'` because the installed NativeWind preview version does not expose `nativewind/jsx-runtime`.

If Metro shows stale styling or bundling issues, restart with:

```bash
npx expo start -c
```

## Suggested Feature Structure

For future features, keep routes in `src/app` and feature logic in `src/modules`.

```txt
src/
  app/
    (auth)/
      login.tsx
    (tabs)/
      home.tsx

  modules/
    auth/
      api/
      components/
      hooks/
      types/

    user/
      api/
      components/
      hooks/
      types/
```

Route files should compose screens. Business logic, API calls, hooks, and feature components should live in their module.

## Useful Commands

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
```
