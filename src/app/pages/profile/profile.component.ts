import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  user = {
    id: '9527',
    name: '族谱维护者',
    email: 'user@example.com',
  };

  actions = [
    { label: '历史记录', desc: '查看最近访问和操作记录', disabled: true },
    { label: '创建族谱', desc: '快速创建新的族谱', disabled: false, link: '/family' },
    { label: '导入族谱', desc: '从文件或外部来源导入', disabled: true },
  ];
}
