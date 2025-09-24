# Vibbly

## Todo

- refactor: package name prefix: workspace -> repo
- feat: 사이드바 추가 및 기본 메뉴 설정
- feat: 계정 등록 기능 구현 (auth page)
- feat: 스팸 댓글 감지 및 필터링
- feat: 대시보드 구현 (dashboard page)
- feat: 알림 시스템 구현
- feat: 프리미엄 결제 구현 (stripe)

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Tailwind

Your `tailwind.config.ts` and `globals.css` are already set up to use the components from the `ui` package.
