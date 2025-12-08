import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'pdf/:id',
    renderMode: RenderMode.Client // Use client-side rendering to avoid SSR issues with PDF viewer
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
