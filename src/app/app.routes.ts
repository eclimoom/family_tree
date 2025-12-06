import { Routes } from '@angular/router';
import { FamilyListPageComponent } from './pages/family-list-page/family-list-page.component';
import { FamilyPageComponent } from './pages/family/family.page';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'family' },
  { path: 'family', component: FamilyListPageComponent, title: '族谱列表' },
  { path: 'family/:id', component: FamilyPageComponent, title: '族谱详情' },
  { path: 'me', component: ProfileComponent, title: '我的' },
  { path: '**', redirectTo: 'family' },
];
