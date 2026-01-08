import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import data from '../../mock/data.json';

export interface PersonNode {
  data: {
    id: string;
    name?: string;
    birthDate?: string;
    deathDate?: string;
    birthAddress?: string;
    livingAddress?: string;
    gender?: string;
    isLiving?: boolean;
    portraitUrl?: string;
    spouse?: string;
    coupleId?: string;
    parent?: string;
    generation?: number;
    isGroup?: boolean;
    isCouple?: boolean;
  };
  classes?: string;
  selected?: boolean;
}

export interface RelationEdge {
  data: {
    source: string;
    target: string;
    id?: string;
    relation?: string;
  };
  classes?: string;
}

export interface Genealogy {
  id: string;
  name: string;
  nodes: PersonNode[];
  edges: RelationEdge[];
}

@Injectable({ providedIn: 'root' })
export class GenealogyStoreService {
  private readonly store$ = new BehaviorSubject<Genealogy[]>([
    {
      id: 'default',
      name: '默认族谱',
      nodes: (data as any).nodes || [],
      edges: (data as any).edges || [],
    },
  ]);

  trees$ = this.store$.asObservable();

  list(): Genealogy[] {
    return this.store$.getValue();
  }

  getTree(id: string | null | undefined): Genealogy | undefined {
    if (!id) return undefined;
    return this.store$.getValue().find((t) => t.id === id);
  }

  createTree(name: string): Genealogy {
    const trimmed = name.trim();
    const id = `tree-${Date.now()}`;
    const newTree: Genealogy = {
      id,
      name: trimmed || '未命名族谱',
      nodes: [],
      edges: [],
    };
    const next = [...this.store$.getValue(), newTree];
    this.store$.next(next);
    return newTree;
  }

  updateTree(updated: Genealogy) {
    if (!updated?.id) return;
    const trees = this.store$.getValue();
    const idx = trees.findIndex((t) => t.id === updated.id);
    if (idx === -1) return;
    const next = [...trees];
    next[idx] = {
      ...updated,
      nodes: [...(updated.nodes || [])],
      edges: [...(updated.edges || [])],
    };
    this.store$.next(next);
  }
}
