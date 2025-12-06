import { Routes } from '@angular/router';
import { TreeListComponent } from './pages/tree-list/tree-list.component';
import { GenealogyPageComponent } from './pages/genealogy/genealogy.page';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'trees' },
  { path: 'trees', component: TreeListComponent, title: '族谱列表' },
  { path: 'trees/:id', component: GenealogyPageComponent, title: '族谱详情' },
  { path: 'me', component: ProfileComponent, title: '我的' },
  { path: '**', redirectTo: 'trees' },
];
