import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import cytoscape, { Core, NodeSingular, EventObject } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { transformToGenealogyLayout, createGenealogyLayout, arrangeCompoundNodePositions } from './genealogy-layout';
import data from '../mock/data.json';

// 注册 dagre 布局
cytoscape.use(dagre);

// 节点和布局配置常量
const NODE_CONFIG = {
  width: 100,        // 节点宽度
  height: 50,        // 节点高度
  padding: 10,       // 节点内边距（px）
};

const LAYOUT_CONFIG = {
  nodeSep: 40,      // 同一层级节点间距
  rankSep: 130,      // 辈分间距
  coupleGap: 110,    // 夫妻左右间距
  padding: 40,       // 布局内边距
  initialZoom: 0.9,  // 初始缩放比例
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef<HTMLDivElement>;
  
  title = 'family_tree';
  cy: Core | null = null;
  
  // 用户信息
  selectedUser: any = null;
  stepName = '';
  
  // 拖拽状态
  draggedParentNode: any = null;
  dragStartParentPos: { x: number; y: number } | null = null;
  dragStartChildPos: { x: number; y: number } | null = null;

  ngOnInit() {
    // 初始化用户ID显示
    const userIdElement = document.getElementById('user-id');
    if (userIdElement) {
      userIdElement.textContent = '您好, 9527';
    }
  }

  ngAfterViewInit() {
    this.initCytoscape();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    if (this.cy) {
      this.cy.destroy();
    }
  }

  private initCytoscape() {
    const container = document.getElementById('cy');
    if (!container) {
      console.error('Cytoscape container not found');
      return;
    }

    // 转换数据以支持族谱布局（夫妻分组）
    const transformedData = transformToGenealogyLayout(data as any);
    console.log("转换后的节点数:", transformedData.nodes.length);
    console.log("转换后的边数:", transformedData.edges.length);

    // 创建族谱布局配置（按辈分分层 + 复合节点）
    const layout = createGenealogyLayout(transformedData, {
      nodeSep: LAYOUT_CONFIG.nodeSep,
      rankSep: LAYOUT_CONFIG.rankSep,
      coupleGap: LAYOUT_CONFIG.coupleGap,
      fit: true,
      padding: LAYOUT_CONFIG.padding,
      onStop: ({ cy }) => {
        cy.zoom(LAYOUT_CONFIG.initialZoom);
        cy.center();
        const node = cy.$(":selected");
        // 检查节点是否存在且不是空集合
        if (node && node.length > 0) {
          const nodeData = node.data();
          // 确保 data 存在且有 name 属性
          if (nodeData && nodeData.name) {
            this.handleSelected(nodeData);
          }
        }
        // 渲染代系数标签
        this.renderGenerationLabels(cy);
      },
    });

    // 定义样式
    const styles: any = [
      {
        selector: "node",
        style: {
          label: "data(name)",
          "text-wrap": "wrap",
          "text-valign": "center",
          "background-color": "white",
          "background-opacity": 0.5,
          height: NODE_CONFIG.height,
          width: NODE_CONFIG.width,
          shape: "roundrectangle",
        },
      },
      {
        selector: "node:parent", // 复合节点（夫妻组）
        style: {
          "background-color": "transparent",
          "background-opacity": 0,
          "border-width": 0,
          "padding": `${NODE_CONFIG.padding}px`,
        },
      },
      {
        selector: "node.couple-group", // 夫妻组容器
        style: {
          "background-color": "transparent",
          "background-opacity": 0,
          "border-width": 0,
        },
      },
      {
        selector: ":selected",
        style: {
          label: "data(name)",
          "text-valign": "center",
          color: "#ffffff",
          "background-color": "#242048",
        },
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          width: 2,
          "line-color": "#a9a8ba",
          "target-arrow-color": "#CECECE",
        },
      },
      {
        selector: "edge.parent-child",
        style: {
          "curve-style": "taxi",
          "taxi-direction": "vertical",
          "taxi-turn": "30",
          width: 2,
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#a9a8ba",
        },
      },
      {
        selector: "edge.sibling-edge",
        style: {
          "curve-style": "straight",
          "line-style": "dashed",
          width: 1,
          "line-color": "#c7c4d4",
          "target-arrow-shape": "none",
        },
      },
      {
        selector: "edge.spouse-edge",
        style: {
          "curve-style": "straight",
          width: 1,
          "line-color": "#b3b0c5",
          "target-arrow-shape": "none",
        },
      },
      {
        selector: "edge.taxi-female",
        style: {
          "line-color": "#743635",
          width: 1,
          "line-opacity": 0.4,
        },
      },
      {
        selector: "edge.couple-connection",
        style: {
          "line-color": "transparent",
          "line-opacity": 0,
          width: 0,
          "target-arrow-shape": "none",
        },
      },
    ];

    this.cy = cytoscape({
      container: container,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: styles,
      elements: transformedData, // 使用转换后的数据
      selectionType: 'single',
      layout: layout as any,
    });

    // 初始化代系标签位置，避免首次渲染时左侧标签缺失
    this.renderGenerationLabels(this.cy);

    // 节点点击事件
    this.cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      // 处理所有节点的点击（不再有复合节点）
      this.handleSelected(node.data());
    });

    // 处理复合节点的拖拽：子节点可以被选中，但拖拽时移动整个复合节点
    this.cy.on('grab', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      
      // 如果是子节点（有父节点），记录父节点和初始位置
      if ((node as any).isChild && (node as any).isChild()) {
        const parentNode = (node as any).parent();
        if (parentNode && parentNode.length > 0) {
          this.draggedParentNode = parentNode;
          this.dragStartParentPos = { ...parentNode.position() };
          this.dragStartChildPos = { ...node.position() };
        }
      }
    });

    this.cy.on('drag', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      
      // 如果拖拽的是子节点，阻止子节点移动，改为移动父节点
      if ((node as any).isChild && (node as any).isChild() && this.draggedParentNode) {
        const parentNode = (node as any).parent();
        if (parentNode && parentNode.id() === this.draggedParentNode.id()) {
          // 获取子节点当前的位置（已经被拖拽移动了）
          const currentChildPos = node.position();
          
          // 计算子节点的移动偏移量
          const deltaX = currentChildPos.x - (this.dragStartChildPos?.x || 0);
          const deltaY = currentChildPos.y - (this.dragStartChildPos?.y || 0);
          
          // 将子节点位置重置回初始位置
          node.position(this.dragStartChildPos!);
          
          // 移动父节点
          const newParentPos = {
            x: (this.dragStartParentPos?.x || 0) + deltaX,
            y: (this.dragStartParentPos?.y || 0) + deltaY
          };
          parentNode.position(newParentPos);
          
          // 更新所有子节点的位置，保持相对位置
          const children = parentNode.children();
          const sorted = children.toArray().sort((a: any, b: any) => {
            const genderA = a.data('gender') || '';
            const genderB = b.data('gender') || '';
            const genderScore = this.genderWeight(genderA) - this.genderWeight(genderB);
            if (genderScore !== 0) return genderScore;
            return (a.data('id') || '').localeCompare(b.data('id') || '');
          });
          
          if (sorted.length === 1) {
            sorted[0].position(newParentPos);
          } else {
            const gap = LAYOUT_CONFIG.coupleGap;
            const startX = newParentPos.x - ((sorted.length - 1) * gap) / 2;
            sorted.forEach((child: any, idx: number) => {
              child.position({
                x: startX + idx * gap,
                y: newParentPos.y,
              });
            });
          }
          
          // 更新拖拽起始位置，以便下次拖拽时使用
          this.dragStartParentPos = { ...newParentPos };
          this.dragStartChildPos = { ...node.position() };
        }
      }
    });

    this.cy.on('free', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      
      // 拖拽结束后，清理状态并重新对齐
      if (this.draggedParentNode && (node as any).isChild && (node as any).isChild()) {
        const parentNode = (node as any).parent();
        if (parentNode && parentNode.id() === this.draggedParentNode.id()) {
          // 重新对齐复合节点内部位置
          arrangeCompoundNodePositions(this.cy!, LAYOUT_CONFIG.coupleGap);
        }
      }
      
      this.draggedParentNode = null;
      this.dragStartParentPos = null;
      this.dragStartChildPos = null;
    });

    // 监听画布的缩放和平移事件，更新代系数标签位置
    this.cy.on('pan zoom', () => {
      this.updateGenerationLabelsPosition(this.cy!);
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.updateGenerationLabelsPosition(this.cy!);
    });
  }

  private setupEventListeners() {
    // 添加关系按钮
    const addRelationBtn = document.querySelector('.add-relation-btn');
    if (addRelationBtn) {
      addRelationBtn.addEventListener('click', () => {
        this.addRelation();
      });
    }

    // 返回按钮
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.cy) {
          const node = this.cy.$(":selected");
          if (node && node.length > 0) {
            const nodeData = node.data();
            if (nodeData && nodeData.name) {
              const userWrap = document.querySelector('.user-wrap');
              if (userWrap) {
                userWrap.classList.remove('add-relation');
              }
              this.handleSelected(nodeData);
            }
          } else {
            console.log("no select user!");
          }
        }
      });
    }

    // 性别按钮点击处理
    const genderInputs = document.querySelectorAll('input[name="gender"]');
    genderInputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLElement;
        // 移除所有按钮的 active 类
        genderInputs.forEach((inp) => {
          const label = inp.closest('label.btn');
          if (label) {
            label.classList.remove('active');
          }
        });
        // 为选中的按钮添加 active 类
        const label = target.closest('label.btn');
        if (label) {
          label.classList.add('active');
        }
      });
    });
  }

  handleSelected(data: any) {
    // 确保 data 存在
    if (!data) {
      console.warn("handleSelected: data is undefined");
      return;
    }
    this.setUserInfo(data);
  }

  setUserInfo(data: any) {
    // 处理 data 为 undefined 或空对象的情况
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
      families = [] 
    } = data;

    const fnameInput = document.getElementById('fname') as HTMLInputElement;
    const nameElement = document.querySelector('.name');
    const lifespaElement = document.querySelector('.lifespa');
    const birthdateInput = document.getElementById('birthdate') as HTMLInputElement;
    const birthAddressInput = document.getElementById('birthAddress') as HTMLInputElement;
    const livingAddressInput = document.getElementById('livingAddress') as HTMLInputElement;
    const avatarImg = document.querySelector('.avatar') as HTMLImageElement;

    if (fnameInput) fnameInput.value = name || '';
    if (nameElement) nameElement.textContent = name || '';
    if (lifespaElement) lifespaElement.textContent = isLiving ? "在世" : "过世";
    
    const _g = ["男", "女"].includes(gender) ? gender : "未知";
    
    // 处理性别选择
    const genderInputs = document.querySelectorAll('input[name="gender"]') as NodeListOf<HTMLInputElement>;
    genderInputs.forEach((input) => {
      const label = input.closest('label.btn');
      if (label) {
        label.classList.remove('active');
      }
      input.checked = false;
    });
    
    const selectedGender = Array.from(genderInputs).find((input) => input.value === _g);
    if (selectedGender) {
      selectedGender.checked = true;
      const label = selectedGender.closest('label.btn');
      if (label) {
        label.classList.add('active');
      }
    }

    if (birthdateInput) birthdateInput.value = birthDate;
    if (birthAddressInput) birthAddressInput.value = birthAddress;
    if (livingAddressInput) livingAddressInput.value = livingAddress;
    
    // 根据性别使用默认头像
    const _portraitUrl = _g === "女" ? 'assets/female.png' : 'assets/male.png';
    
    if (avatarImg) {
      avatarImg.src = _portraitUrl;
    }
    
    console.log(name);
  }

  addRelation() {
    this.stepName = 'add';
    // 1.隐藏tools
    const userWrap = document.querySelector('.user-wrap');
    if (userWrap) {
      userWrap.classList.add('add-relation');
    }
    this.setUserInfo({});
  }

  /**
   * 渲染代系数标签
   * 在画布左侧显示代系数，与族谱布局的代系线对齐
   */
  private renderGenerationLabels(cy: Core) {
    const labelsContainer = document.getElementById('generation-labels');
    if (!labelsContainer) return;
    
    labelsContainer.innerHTML = '';

    // 收集所有代系及其节点引用
    // 使用实际显示的节点（非复合节点）来获取Y坐标，这样能准确对齐
    const generationMap = new Map<number, any[]>();
    
    // 遍历所有实际显示的节点（非复合节点），获取代系信息
    cy.nodes(':not(:parent)').forEach((node: any) => {
      const generation = node.data('generation');
      if (generation !== undefined && generation !== null) {
        // 存储节点引用，以便后续获取实时渲染位置
        if (!generationMap.has(generation)) {
          generationMap.set(generation, [node]);
        } else {
          generationMap.get(generation)!.push(node);
        }
      }
    });

    // 按代系排序
    const sortedGenerations = Array.from(generationMap.entries()).sort((a, b) => a[0] - b[0]);

    // 创建代系数标签，存储节点引用以便实时更新位置
    sortedGenerations.forEach(([generation, nodes]) => {
      const label = document.createElement('div');
      label.className = 'generation-label';
      label.textContent = `${generation}`;
      (label as any).dataset.generation = generation;
      (label as any).referenceNodes = nodes; // 存储节点引用
      
      labelsContainer.appendChild(label);
    });

    // 更新标签位置
    this.updateGenerationLabelsPosition(cy);
  }

  /**
   * 更新代系数标签的位置
   * 使用实际节点的渲染位置来对齐标签
   */
  private updateGenerationLabelsPosition(cy: Core) {
    const labels = document.querySelectorAll('#generation-labels .generation-label');
    const container = cy.container();
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    labels.forEach((label) => {
      const referenceNodes = (label as any).referenceNodes;
      
      if (referenceNodes && referenceNodes.length > 0) {
        // 计算该代系所有节点的平均渲染Y坐标
        let totalY = 0;
        let count = 0;
        
        referenceNodes.forEach((node: any) => {
          if (node && node.length > 0) {
            const renderedPos = node.renderedPosition();
            if (renderedPos && renderedPos.y !== undefined) {
              totalY += renderedPos.y;
              count++;
            }
          }
        });
        
        if (count > 0) {
          // renderedPosition 返回的坐标已经包含容器偏移，直接使用即可
          const averageY = totalY / count;
          const screenY = averageY;
          (label as HTMLElement).style.top = `${screenY}px`;
        }
      }
    });
  }

  private genderWeight(gender: string): number {
    if (!gender) return 2;
    if (gender === "男" || gender === "male" || gender === "M") return 0;
    if (gender === "女" || gender === "female" || gender === "F") return 1;
    return 2;
  }
}
