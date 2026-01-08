import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-left-family',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './left-family.component.html',
  styleUrl: './left-family.component.scss',
})
export class LeftFamilyComponent {
  @Input() userInfo: any = {
    id: '',
    name: '',
    gender: '',
    birthDate: '',
    isLiving: true,
    deathDate: '',
    birthAddress: '',
    livingAddress: '',
    families: [],
  };

  @Input() isAddRelationMode = false;
  @Input() userId = '';

  @Output() userInfoChange = new EventEmitter<any>();
  @Output() backBtnClick = new EventEmitter<void>();
  @Output() addRelationClick = new EventEmitter<void>();
  @Output() submitClick = new EventEmitter<any>();

  relationType: 'parent' | 'spouse' | 'sibling' | 'child' = 'spouse';

  // 获取头像 URL
  get avatarUrl(): string {
    return this.userInfo.gender === '女' ? 'assets/female.png' : 'assets/male.png';
  }

  // 获取生命状态文本
  get lifeStatusText(): string {
    return this.userInfo.isLiving ? '在世' : '过世';
  }

  onUserInfoChange() {
    this.userInfoChange.emit(this.userInfo);
  }

  onBackBtnClick() {
    this.backBtnClick.emit();
  }

  onAddRelationClick() {
    this.addRelationClick.emit();
  }

  onSubmitClick() {
    const payload = {
      ...this.userInfo,
      id: this.userInfo?.id || '',
      gender: this.userInfo?.gender || '未知',
      isLiving: this.userInfo?.isLiving !== false,
    };
    this.submitClick.emit({
      relationType: this.relationType,
      payload,
    });
  }
}

