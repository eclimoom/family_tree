import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GenealogyStoreService, Genealogy } from '../../services/genealogy-store.service';
import { GenealogyCanvasComponent } from './components/genealogy-canvas/genealogy-canvas.component';
import { LeftFamilyComponent } from './components/left-family/left-family.component';

@Component({
  selector: 'app-family-page',
  standalone: true,
  imports: [CommonModule, FormsModule, GenealogyCanvasComponent, LeftFamilyComponent],
  templateUrl: './family.page.html',
  styleUrl: './family.page.scss',
})
export class FamilyPageComponent implements OnInit {
  stepName = '';
  currentTree: Genealogy | undefined;
  trees: Genealogy[] = [];
  isAddRelationMode = false; // 控制是否显示添加关系模式
  userId = '您好, 9527'; // 用户ID显示文本
  selectedNode: any = null; // 画布中当前选中的节点
  relationBase: any = null; // 添加关系时的基准节点

  // 用户信息数据模型
  userInfo = {
    id: '',
    name: '',
    gender: '',
    birthDate: '',
    isLiving: true,
    deathDate: '',
    birthAddress: '',
    livingAddress: '',
    families: [] as any[],
  };


  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: GenealogyStoreService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.trees = this.store.list();
    this.store.trees$.subscribe((trees) => {
      this.trees = trees;
    });
    this.route.paramMap.subscribe((params) => {
      const treeId = params.get('id') || 'default';
      this.currentTree = this.store.getTree(treeId) || this.store.getTree('default');
      if (!this.currentTree) {
        this.router.navigate(['/family']);
        return;
      }
    });
  }

  get currentTreeName(): string {
    return this.currentTree?.name || '未选择族谱';
  }

  onTreeSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const nextId = target.value;
    if (!nextId) return;
    this.router.navigate(['/family', nextId]);
  }

  goBackToList() {
    this.router.navigate(['/family']);
  }

  onAddRelationClick() {
    this.addRelation();
  }

  onBackBtnClick() {
    this.isAddRelationMode = false;
  }

  handleSelected(data: any) {
    if (!data) return;
    this.selectedNode = data;
    this.setUserInfo(data);
  }

  setUserInfo(data: any) {
    if (!data) {
      data = {};
    }
    const {
      id = '',
      name = '',
      gender = '',
      birthDate = '',
      isLiving = true,
      deathDate = '',
      birthAddress = '',
      livingAddress = '',
      families = [],
    } = data;

    // 使用 setTimeout 将更新推迟到下一个变更检测周期，避免 ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      // 使用 Angular 双向绑定更新数据模型
      this.userInfo = {
        id: id || '',
        name: name || '',
        gender: ['男', '女'].includes(gender) ? gender : '未知',
        birthDate: birthDate || '',
        isLiving,
        deathDate: deathDate || '',
        birthAddress: birthAddress || '',
        livingAddress: livingAddress || '',
        families: families || [],
      };
      this.cdr.markForCheck();
      console.log(this.userInfo.name, this.userInfo.deathDate, this.userInfo.families?.length || 0);
    }, 0);
  }

  addRelation() {
    this.stepName = 'add';
    this.isAddRelationMode = true;
    // 记录基准节点（优先使用画布选中的节点）
    this.relationBase = this.selectedNode || this.userInfo;
    // 清空表单用于录入新成员
    this.setUserInfo({});
  }

  onSubmit(event: { payload: any; relationType?: string }) {
    if (!event || !event.payload || !this.currentTree) return;
    const relationType = event.relationType || 'spouse';
    const payload = event.payload;
    const normalizedId = (payload.id || '').trim() || `person_${Date.now()}`;
    let normalizedData = {
      ...payload,
      id: normalizedId,
      gender: ['男', '女', '未知'].includes(payload.gender) ? payload.gender : '未知',
      isLiving: payload.isLiving !== false,
    };

    const nextNodes = [...(this.currentTree.nodes || [])];
    const existIdx = nextNodes.findIndex((n) => n?.data?.id === normalizedId);
    const nextEdges = [...(this.currentTree.edges || [])];

    // 先处理新增 / 更新自身
    if (existIdx > -1) {
      nextNodes[existIdx] = {
        ...nextNodes[existIdx],
        data: {
          ...nextNodes[existIdx].data,
          ...normalizedData,
        },
      };
    } else {
      nextNodes.push({ data: normalizedData });
    }

    // 如果是添加关系且存在基准节点，更新双方的关联字段
    if (relationType === 'spouse' && this.relationBase?.id) {
      const baseId = this.relationBase.id;
      const baseIdx = nextNodes.findIndex((n) => n?.data?.id === baseId);
      const coupleId =
        this.relationBase.coupleId ||
        normalizedData.coupleId ||
        `couple_${baseId}_${normalizedId}`;

      // 更新基准节点
      if (baseIdx > -1) {
        nextNodes[baseIdx] = {
          ...nextNodes[baseIdx],
          data: {
            ...nextNodes[baseIdx].data,
            spouse: normalizedId,
            coupleId,
          },
        };
      }

      // 更新新添加节点
      const newIdx = nextNodes.findIndex((n) => n?.data?.id === normalizedId);
      if (newIdx > -1) {
        nextNodes[newIdx] = {
          ...nextNodes[newIdx],
          data: {
            ...nextNodes[newIdx].data,
            spouse: baseId,
            coupleId,
          },
        };
      }
    }

    if (relationType === 'child' && this.relationBase?.id) {
      const baseId = this.relationBase.id;
      const spouseId = this.relationBase.spouse;
      const childGeneration = (this.relationBase.generation ?? 0) + 1;

      // 更新子代的辈分信息
      const childIdx = nextNodes.findIndex((n) => n?.data?.id === normalizedId);
      if (childIdx > -1) {
        nextNodes[childIdx] = {
          ...nextNodes[childIdx],
          data: {
            ...nextNodes[childIdx].data,
            generation: nextNodes[childIdx].data.generation ?? childGeneration,
          },
        };
        normalizedData = nextNodes[childIdx].data;
      }

      const addParentEdge = (parentId: string | undefined, childId: string) => {
        if (!parentId) return;
        const exists = nextEdges.some(
          (e) => e?.data?.source === parentId && e?.data?.target === childId
        );
        if (exists) return;
        nextEdges.push({
          data: {
            id: `edge_${parentId}_${childId}`,
            source: parentId,
            target: childId,
            relation: 'parent-child',
          },
          classes: 'parent-child',
        });
      };

      addParentEdge(baseId, normalizedId);
      addParentEdge(spouseId, normalizedId);
    }

    const nextTree = {
      ...this.currentTree,
      nodes: nextNodes,
      edges: nextEdges,
    };

    this.currentTree = nextTree;
    this.store.updateTree(nextTree);
    this.setUserInfo(normalizedData);
    this.isAddRelationMode = false;
    this.relationBase = null;
  }

}
