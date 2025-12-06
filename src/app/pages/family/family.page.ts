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

  // 用户信息数据模型
  userInfo = {
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
    this.setUserInfo(data);
  }

  setUserInfo(data: any) {
    if (!data) {
      data = {};
    }
    const {
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
    this.setUserInfo({});
  }

}
