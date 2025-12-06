import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GenealogyStoreService, Genealogy } from '../../services/genealogy-store.service';

@Component({
  selector: 'app-family-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './family-list-page.component.html',
  styleUrl: './family-list-page.component.scss',
})
export class FamilyListPageComponent {
  trees: Genealogy[] = [];
  creating = false;
  newTreeName = '';

  constructor(private readonly store: GenealogyStoreService, private readonly router: Router) {
    this.trees = this.store.list();
    this.store.trees$.subscribe((trees) => (this.trees = trees));
  }

  trackById(_: number, item: Genealogy) {
    return item.id;
  }

  toggleCreate() {
    this.creating = !this.creating;
    if (!this.creating) {
      this.newTreeName = '';
    }
  }

  createTree() {
    if (!this.newTreeName.trim()) {
      return;
    }
    const created = this.store.createTree(this.newTreeName);
    this.newTreeName = '';
    this.creating = false;
    this.router.navigate(['/family', created.id]);
  }

  goDetail(id: string) {
    this.router.navigate(['/family', id]);
  }
}

