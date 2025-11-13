import { Routes } from '@angular/router';
import { PdfLibraryComponent } from './pdf-library/pdf-library.component';
import { PdfDetailComponent } from './pdf-detail/pdf-detail.component';

export const routes: Routes = [
  { path: '', component: PdfLibraryComponent, pathMatch: 'full' },
  { path: 'recent', component: PdfLibraryComponent },
  { path: 'about', component: PdfLibraryComponent },
  { path: 'pdf/:id', component: PdfDetailComponent },
  { path: '**', redirectTo: '' }
];
